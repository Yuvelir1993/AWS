def main(event, context):
    # TODO: where Lambda saves the logs?
    print(context)
    print(event)
    print("Hello from my Lambda function!!")

    return {
        'statusCode': 200,
        'body': event
    }
