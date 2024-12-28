from interface import IS3Client
import boto3

class S3Client(IS3Client):
    def __init__(self, bucket_name: str):
        self.bucket_name = bucket_name
        self.s3 = boto3.client("s3")

    def upload_file(self, key: str, file_path: str, content_type: str) -> None:
        self.s3.upload_file(
                            file_path,
                            self.bucket_name,
                            key,
                            ExtraArgs={'ContentType': content_type}
                        )