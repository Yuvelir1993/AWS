from s3.client import IS3Client

class MockS3Client(IS3Client):
    def __init__(self):
        self.uploads = []
        self.downloads = {}

    def upload_file(self, key: str, file_path: str, content_type: str) -> None:
        self.uploads.append((key, file_path))
