def main(event, context):
    # TODO: where Lambda saves the logs?
    print(context)
    print(event)

    return {
        'statusCode': 200,
        'body': event
    }
