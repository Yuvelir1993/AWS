import os
import json
import urllib.parse
import boto3

print('Loading function...')

s3 = boto3.client('s3')


def read_from_s3(event, context):
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
    prefix_documentation = os.environ.get('PREFIX_DOCUMENTATION')
    prefix_documentation_metadata = os.environ.get(
        'PREFIX_DOCUMENTATION_METADATA')

    print(f"Environment - BUCKET_NAME: {bucket_name}")
    print(f"Environment - PREFIX_DOCUMENTATION: {prefix_documentation}")
    print(
        f"Environment - PREFIX_DOCUMENTATION_METADATA: {prefix_documentation_metadata}")

    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(
        event['Records'][0]['s3']['object']['key'], encoding='utf-8')

    print(f"Event - Bucket name: {bucket}")
    print(f"Event - Object name: {key}")

    try:
        response = s3.get_object(Bucket=bucket, Key=key)
        print("CONTENT TYPE: " + response['ContentType'])
        return response['ContentType']
    except Exception as e:
        print(e)
        print('Error getting object {} from bucket {}. Make sure they exist and your bucket is in the same region as this function.'.format(key, bucket))
        raise e
