import os
import re
import json
import tempfile
import urllib.parse
import zipfile
from pathlib import Path
import boto3

print('Loading function...')

s3 = boto3.client('s3')


def generate_doc_links_on_upload(event, context):
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

    project_name, project_version = match.groups()
    print(f"Extracted Project Name: {
          project_name}, Version: {project_version}")

    try:
        generate_doc_links(doc_links_json, projects_space, bucket,
                           uploaded_object_key, project_name, project_version)
        unzip(bucket, uploaded_object_key, projects_space,
              project_name, project_version)

    except Exception as e:
        print(f"Error processing {uploaded_object_key} from bucket {
              bucket}. Exception: {e}")
        raise e


def unzip(bucket, uploaded_object_key, projects_space, project_name, project_version):
    """
    Unzipping the uploaded project and uploading its contents to the `projects_space` in the S3 bucket.
    """
    try:
        temp_dir = Path(tempfile.gettempdir())
        local_zip_path = temp_dir / Path(uploaded_object_key).name
        s3.download_file(bucket, uploaded_object_key, str(local_zip_path))
        print(f"Downloaded {uploaded_object_key} to {local_zip_path}")

        with tempfile.TemporaryDirectory() as temp_extract_dir:
            temp_extract_path = Path(temp_extract_dir)
            with zipfile.ZipFile(local_zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_extract_path)
            print(f"Extracted {uploaded_object_key} to {temp_extract_path}")

            for file_path in temp_extract_path.rglob("*"):
                if file_path.is_file():
                    relative_path = file_path.relative_to(temp_extract_path)
                    full_project_name = project_name + "-" + project_version
                    s3_key = str(Path(projects_space) /
                                 full_project_name / relative_path)
                    print(f"Start uploading {file_path} to {bucket}/{s3_key}")
                    s3.upload_file(str(file_path), bucket, s3_key)
                    print(f"Uploaded {file_path} to {
                          s3_key} in bucket {bucket}")

    except Exception as e:
        print(f"Error unzipping {uploaded_object_key} and uploading contents to {
              projects_space}. Exception: {e}")
        raise e


def generate_doc_links(doc_links_json, projects_space, bucket, uploaded_object_key, project_name, project_version):
    """
    Generating/updating 'docLinks.json' with all proejcts metadata.
    """
    s3_index_html_url = f"https://{bucket}.s3.amazonaws.com/{
        uploaded_object_key.replace('.zip', '/docs/index.html')}"
    s3_readme_url = f"https://{bucket}.s3.amazonaws.com/{
        uploaded_object_key.replace('.zip', '/README.md')}"

    new_doc_links_entry = {
        "name": project_name,
        "version": project_version,
        "urlIndexHtml": s3_index_html_url,
        "urlReadme": s3_readme_url
    }

    doc_links = []

    try:
        metadata_response = s3.get_object(
            Bucket=bucket, Key=doc_links_json)
        metadata_content = metadata_response['Body'].read().decode('utf-8')
        doc_links = json.loads(metadata_content)
        print(f"Existing {doc_links_json} loaded. Version: {
            metadata_response.get('VersionId', 'N/A')}")
    except s3.exceptions.NoSuchKey:
        print(f"{doc_links_json} does not exist.")

    doc_links.append(new_doc_links_entry)

    s3.put_object(
        Bucket=bucket,
        Key=doc_links_json,
        Body=json.dumps(doc_links, indent=2),
        ContentType='application/json'
    )
    print(f"{doc_links_json} updated successfully.")
