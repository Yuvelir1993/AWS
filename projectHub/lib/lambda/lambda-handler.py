import os
import re
import json
import urllib.parse
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
    print(f"Extracted Project Name: {project_name}, Version: {project_version}")

    try:
        s3_index_html_url = f"https://{bucket}.s3.amazonaws.com/{projects_space}/{
            uploaded_object_key.replace('.zip', '/index.html')}"
        s3_readme_url = f"https://{bucket}.s3.amazonaws.com/{projects_space}/{
            uploaded_object_key.replace('.zip', '/index.html')}"

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

    except Exception as e:
        print(f"Error processing {uploaded_object_key} from bucket {
              bucket}. Exception: {e}")
        raise e
