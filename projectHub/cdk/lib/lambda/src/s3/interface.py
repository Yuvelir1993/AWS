from abc import ABC, abstractmethod

class IS3Client(ABC):
    @abstractmethod
    def upload_file(self, key: str, file_path: str, content_type: str) -> None:
        """Upload a file to S3."""
        pass