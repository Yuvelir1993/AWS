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
    key = urllib.parse.unquote_plus(
        event['Records'][0]['s3']['object']['key'], encoding='utf-8')

    print(f"Event - Bucket name: {bucket}")
    print(f"Event - Object name: {key}")

    pattern = r"^([a-zA-Z0-9_-]+)-([a-zA-Z0-9._-]+)\.zip$"
    filename = os.path.basename(key)
    match = re.match(pattern, filename)

    if not match:
        print(f"Invalid filename pattern: {filename}. Skipping this file.")
        return {
            'statusCode': 400,
            'body': json.dumps(f"Invalid file name pattern: {filename}")
        }

    projectname, projectversion = match.groups()
    print(f"Extracted Project Name: {projectname}, Version: {projectversion}")

    try:
        s3_docu_url = f"https://{bucket}.s3.amazonaws.com/{
            key.replace('.zip', '/index.html')}"

        new_doc_links_entry = {
            "name": projectname,
            "version": projectversion,
            "url": s3_docu_url
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
        print(f"Error processing {key} from bucket {bucket}. Exception: {e}")
        raise e
