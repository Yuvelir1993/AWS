from dataclasses import dataclass
import os
from os import environ
import re
import json
import tempfile
import urllib.parse
import mimetypes
from pathlib import Path
import boto3
from boto3 import resource
import shutil

from aws_lambda_powertools.utilities.data_classes.s3_object_event import S3ObjectLambdaEvent
from aws_lambda_powertools.utilities.typing import LambdaContext

from helpers import Validator, generate_error_index_html

print('Loading function...')

s3 = boto3.client('s3')

_LAMBDA_S3_RESOURCE = { "resource" : resource('s3'),
                        "bucket_name" : environ.get("BUCKET_NAME","NONE") }

class LambdaS3Class:
    """
    AWS S3 Resource Class
    """
    def __init__(self, lambda_s3_resource):
        """
        Initialize an S3 Resource
        """
        self.resource = lambda_s3_resource["resource"]
        self.bucket_name = lambda_s3_resource["bucket_name"]
        self.bucket = self.resource.Bucket(self.bucket_name)

@dataclass
class Project:
    name: str
    version: str

    @property
    def full_name(self):
        return f"{self.name}-{self.version}"


def handler(event: S3ObjectLambdaEvent, context: LambdaContext):
    """
    The entry point into the current Lambda file.
    """

    global _LAMBDA_S3_RESOURCE
    s3_resource_class = LambdaS3Class(_LAMBDA_S3_RESOURCE)

    print("Received event: " + json.dumps(event, indent=2))
    print("Function Name:", context.function_name)
    print("Function Version:", context.function_version)
    print("Invoked Function ARN:", context.invoked_function_arn)
    print("Memory Limit (MB):", context.memory_limit_in_mb)
    print("Request ID:", context.aws_request_id)
    print("Log Group Name:", context.log_group_name)
    print("Log Stream Name:", context.log_stream_name)
    print("Remaining Execution Time (ms):",
          context.get_remaining_time_in_millis())

    bucket_name = os.environ.get('BUCKET_NAME')
    doc_links_json = os.environ.get('DOC_LINKS_JSON')
    projects_space = os.environ.get('PROJECTS_SPACE')

    print(f"Environment - BUCKET_NAME: {bucket_name}")
    print(f"Environment - BUCKET_NAME (s3_resource_class): {s3_resource_class.bucket_name}")
    print(f"Environment - PROJECTS_SPACE: {projects_space}")
    print(f"Environment - DOC_LINKS_JSON: {doc_links_json}")

    bucket = event['Records'][0]['s3']['bucket']['name']
    uploaded_object_key = urllib.parse.unquote_plus(
        event['Records'][0]['s3']['object']['key'], encoding='utf-8')

    print(f"Event - Bucket name: {bucket}")
    print(f"Event - Object name: {uploaded_object_key}")

    pattern = r"^([a-zA-Z0-9_-]+)-([a-zA-Z0-9._-]+)\.zip$"
    uploaded_filename = os.path.basename(uploaded_object_key)
    match = re.match(pattern, uploaded_filename)

    if not match:
        print(f"Invalid filename pattern: {
              uploaded_filename}. Skipping this file.")
        return {
            'statusCode': 400,
            'body': json.dumps(f"Invalid file name pattern: {uploaded_filename}")
        }

    project = Project(name=match.group(1), version=match.group(2))
    print(f"Extracted Project: {project}")

    try:
        generate_doc_links(doc_links_json, uploaded_object_key, project, s3_resource_class)
        path_fetched_object_from_s3 = fetch_uploaded_object(uploaded_object_key, s3_resource_class)
        with tempfile.TemporaryDirectory() as tmp_dir:
            path_dir_to_extract_archive_into = Path(tmp_dir)
            s3_key_project = f"{projects_space}/{project.full_name}"
            unzip_validate_upload(s3_resource_class, s3_key_project, path_fetched_object_from_s3, path_dir_to_extract_archive_into)
    except KeyError as index_error:
        print(f"Error 404 processing {uploaded_object_key} from bucket {
        s3_resource_class.bucket_name}. Exception: {index_error}")
    except Exception as e:
        print(f"Error processing {uploaded_object_key} from bucket {
              s3_resource_class.bucket_name}. Exception: {e}")
        raise e

def fetch_uploaded_object(uploaded_object_key: str, s3_resource: LambdaS3Class) -> Path:
    """
    Fetching uploaded to S3 object to a temporary directory.
    """
    try:
        local_zip_path = Path(tempfile.gettempdir()) / Path(uploaded_object_key).name
        s3_resource.bucket.download_file(uploaded_object_key, str(local_zip_path))
        print(f"Downloaded '{uploaded_object_key}' from S3 to a local temp '{local_zip_path}'")
        return local_zip_path
    except Exception as e:
        print(f"An error during fetching object from s3 occurred: {e}")
        raise e


def unzip_validate_upload(s3_resource: LambdaS3Class, s3_key_project: str, path_fetched_object_from_s3: Path, path_dir_to_extract_archive_into: Path):
    """
    Unzipping the uploaded project, validating, and uploading its contents to the `projects_space` in the S3 bucket.
    If validation fails, uploads an error index.html to the 'docs' folder.
    """
    try:
        shutil.unpack_archive(path_fetched_object_from_s3, path_dir_to_extract_archive_into)
        print(f"Extracted uploaded zip '{
              path_fetched_object_from_s3}' to '{path_dir_to_extract_archive_into}'")

        validator = Validator(path_dir_to_extract_archive_into)
        if validator.validate():
            print("Validation passed - uploaded project documentation is OK. Proceeding to upload files.")
            print(f"The uploaded project's documentation will be uploaded into '{s3_key_project}'")
            for root, folders, files in path_dir_to_extract_archive_into.walk():
                for name in files:
                    file_path = Path(root / name)
                    print(f"Proceeding the file {name} located in {file_path}")
                    file_s3_key = f"{s3_key_project}/{str(file_path.relative_to(path_dir_to_extract_archive_into))}"

                    content_type, _ = mimetypes.guess_type(str(file_path))
                    if content_type is None:
                        content_type = 'binary/octet-stream'

                    print(f"Start uploading '{file_path}' to '{file_s3_key}'")

                    s3_resource.bucket.upload_file(
                        file_path,
                        file_s3_key,
                        ExtraArgs={'ContentType': content_type}
                    )

                for folder in folders:
                    print(f"There is a folder {folder} existing after zip extraction")
        else:
            error_messages = validator.get_error_messages()
            error_html_content = generate_error_index_html(error_messages)
            error_index_html_s3_key = f"{s3_key_project}/docs/index.html"
            print(f"Validation failed. Uploading error index.html with report to {error_index_html_s3_key}")

            # Check if 'project.full_name' key exists in s3?
            # Potential place for step functions integration? or sending notification in any other way?
            # p.s. upload_file may be more preferable
            s3_resource.bucket.put_object(
                Key=error_index_html_s3_key,
                Body=error_html_content.encode('utf-8'),
                ContentType='text/html'
            )
    except Exception as e:
        print(f"An error occurred: {e}")
        raise e


def generate_doc_links(doc_links_json, uploaded_object_key, project: Project, s3_resource: LambdaS3Class):
    """
    Generating/updating 'docLinks.json' with all projects infos.
    If the same project (name and version) already exists, it will update the entry.
    """
    s3_index_html_url = f"https://{s3_resource.bucket_name}.s3.amazonaws.com/{
        uploaded_object_key.replace('.zip', '/docs/index.html')}"
    s3_readme_url = f"https://{s3_resource.bucket_name}.s3.amazonaws.com/{
        uploaded_object_key.replace('.zip', '/README.md')}"

    new_doc_links_entry = {
        "name": project.name,
        "version": project.version,
        "urlIndexHtml": s3_index_html_url,
        "urlReadme": s3_readme_url
    }

    doc_links = []

    try:
        metadata_response = s3_resource.bucket.get_object(Key=doc_links_json)
        metadata_content = metadata_response['Body'].read().decode('utf-8')
        doc_links = json.loads(metadata_content)
        print(f"Existing {doc_links_json} loaded. Version: {
            metadata_response.get('VersionId', 'N/A')}")
    except s3.exceptions.NoSuchKey:
        print(f"{doc_links_json} does not exist.")

    updated = False
    for index, entry in enumerate(doc_links):
        if entry['name'] == project.name and entry['version'] == project.version:
            doc_links[index] = new_doc_links_entry
            updated = True
            print(f"Updated existing entry for project '{
                  project.name}' version '{project.version}'.")
            break

    if not updated:
        doc_links.append(new_doc_links_entry)
        print(f"Added new entry for project '{
              project.name}' version '{project.version}'.")

    s3_resource.bucket.put_object(
        Key=doc_links_json,
        Body=json.dumps(doc_links, indent=2),
        ContentType='application/json'
    )
    print(f"{doc_links_json} updated successfully.")
