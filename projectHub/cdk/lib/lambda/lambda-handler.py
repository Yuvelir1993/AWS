from dataclasses import dataclass
import os
import re
import json
import tempfile
import urllib.parse
import zipfile
import mimetypes
from pathlib import Path
import boto3
import html

print('Loading function...')

s3 = boto3.client('s3')


@dataclass
class Project:
    name: str
    version: str

    @property
    def full_name(self):
        return f"{self.name}-{self.version}"


class Validator:
    def __init__(self, extract_path: Path):
        self.extract_path = extract_path
        self.errors = []

    def validate(self) -> bool:
        """
        Runs all validation checks and returns True if all pass, False otherwise.
        """
        checks = [
            self._check_docs_folder_exists,
            self._check_index_html_exists,
            self._check_index_html_has_body,
        ]

        for check in checks:
            check()

        return len(self.errors) == 0

    def _check_docs_folder_exists(self):
        docs_path = self.extract_path / 'docs'
        if not docs_path.is_dir():
            self.errors.append("Missing 'docs' folder.")
        else:
            self.docs_path = docs_path

    def _check_index_html_exists(self):
        if hasattr(self, 'docs_path'):
            index_html_path = self.docs_path / 'index.html'
            if not index_html_path.is_file():
                self.errors.append(
                    "Missing 'index.html' file in 'docs' folder.")
            else:
                self.index_html_path = index_html_path
        else:
            pass

    def _check_index_html_has_body(self):
        if hasattr(self, 'index_html_path'):
            with open(self.index_html_path, 'r', encoding='utf-8') as f:
                content = f.read()
            if not re.search(r'<body[^>]*>', content, re.IGNORECASE):
                self.errors.append(
                    "'index.html' does not contain a <body> element.")

    def get_error_messages(self):
        return self.errors


def generate_error_index_html(error_messages: list) -> str:
    """
    Generates an error index.html content with the provided error messages.
    """
    escaped_messages = [html.escape(message) for message in error_messages]
    error_html = f"""<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Validation Error</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            background-color: #f8d7da;
            color: #721c24;
            margin: 0;
            padding: 20px;
        }}
        .container {{
            max-width: 600px;
            margin: auto;
        }}
        h1 {{
            text-align: center;
        }}
        ul {{
            list-style-type: disc;
            margin-left: 20px;
        }}
        .rules {{
            background-color: #fff3cd;
            color: #856404;
            padding: 15px;
            margin-top: 20px;
            border: 1px solid #ffeeba;
            border-radius: 5px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Validation Failed</h1>
        <p>The uploaded project did not pass the validation checks. Please address the following issues:</p>
        <ul>
            {''.join(f'<li>{message}</li>' for message in escaped_messages)}
        </ul>
        <div class="rules">
            <h2>Submission Rules:</h2>
            <ul>
                <li>The project must contain a <strong>'docs'</strong> folder.</li>
                <li>The <strong>'docs'</strong> folder must include an <strong>'index.html'</strong> file.</li>
                <li>The <strong>'index.html'</strong> file must contain at least a <strong>&lt;body&gt;</strong> element.</li>
                <!-- Add more rules here if needed -->
            </ul>
        </div>
    </div>
</body>
</html>"""
    return error_html


def proceed(event, context):
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

    project = Project(name=match.group(1), version=match.group(2))
    print(f"Extracted Project: {project}")

    try:
        generate_doc_links(doc_links_json, bucket,
                           uploaded_object_key, project)
        unzip_validate_upload(bucket, uploaded_object_key,
                              projects_space, project)

    except Exception as e:
        print(f"Error processing {uploaded_object_key} from bucket {
              bucket}. Exception: {e}")
        raise e


def unzip_validate_upload(bucket, uploaded_object_key, projects_space, project: Project):
    """
    Unzipping the uploaded project, validating, and uploading its contents to the `projects_space` in the S3 bucket.
    If validation fails, uploads an error index.html to the 'docs' folder.
    """
    try:
        temp_dir = Path(tempfile.gettempdir())
        local_zip_path = temp_dir / Path(uploaded_object_key).name
        s3.download_file(bucket, uploaded_object_key, str(local_zip_path))
        print(f"Downloaded {uploaded_object_key} to {local_zip_path}")

        s3_key_project = Path(projects_space) / project.full_name

        with tempfile.TemporaryDirectory() as temp_extract_dir:
            temp_extract_path = Path(temp_extract_dir)
            with zipfile.ZipFile(local_zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_extract_path)
            print(f"Extracted {uploaded_object_key} to {temp_extract_path}")

            validator = Validator(temp_extract_path)
            if validator.validate():
                print("Validation passed. Proceeding to upload files.")
                # may be .walk() would be better?
                for file_path in temp_extract_path.rglob("*"):
                    if file_path.is_file():
                        relative_path = file_path.relative_to(
                            temp_extract_path)

                        s3_key = str(s3_key_project / relative_path)
                        print(f"Start uploading {relative_path} to {s3_key}")

                        content_type, _ = mimetypes.guess_type(str(file_path))
                        if content_type is None:
                            content_type = 'binary/octet-stream'

                        s3.upload_file(
                            str(file_path),
                            bucket,
                            s3_key,
                            ExtraArgs={'ContentType': content_type}
                        )
                    elif file_path.is_dir():
                        print(f"The {file_path} is directory...")
            else:
                print("Validation failed. Uploading error index.html.")
                error_messages = validator.get_error_messages()
                error_html_content = generate_error_index_html(error_messages)

                s3_key = str(s3_key_project / 'docs' / 'index.html')
                print(f"Uploading error index.html to {s3_key}")

                # Check if 'project.full_name' key exists in s3?
                # Potential place for step functions integration? or sending notification in any other way?
                # p.s. upload_file may be more preferable
                s3.put_object(
                    Bucket=bucket,
                    Key=s3_key,
                    Body=error_html_content.encode('utf-8'),
                    ContentType='text/html'
                )
    except Exception as e:
        print(f"An error occurred: {e}")
        raise e


def generate_doc_links(doc_links_json, bucket, uploaded_object_key, project: Project):
    """
    Generating/updating 'docLinks.json' with all projects infos.
    If the same project (name and version) already exists, it will update the entry.
    """
    s3_index_html_url = f"https://{bucket}.s3.amazonaws.com/{
        uploaded_object_key.replace('.zip', '/docs/index.html')}"
    s3_readme_url = f"https://{bucket}.s3.amazonaws.com/{
        uploaded_object_key.replace('.zip', '/README.md')}"

    new_doc_links_entry = {
        "name": project.name,
        "version": project.version,
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

    s3.put_object(
        Bucket=bucket,
        Key=doc_links_json,
        Body=json.dumps(doc_links, indent=2),
        ContentType='application/json'
    )
    print(f"{doc_links_json} updated successfully.")
