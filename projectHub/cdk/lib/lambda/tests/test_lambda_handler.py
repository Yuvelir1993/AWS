# https://github.com/aws-samples/serverless-test-samples/blob/main/python-test-samples/lambda-mock/tests/unit/src/test_sample_lambda.py
# https://stackoverflow.com/questions/68579648/mock-download-file-from-s3-with-actual-file
import os

import pytest
# tests:
# 1. if unpacked zip has desired amount of files
# 1.1 if possible, check that the same amount of files has been uploaded to s3
# 2. if validation passed for the correct zip
# 3. if validation not passed for the not correct zip
from moto import mock_aws
import boto3
from pathlib import Path
import shutil

CURRENT_PATH: Path = Path(os.path.dirname(os.path.realpath(__file__)))
RESOURCES_DOCS_ZIP_SAMPLE_JAVA: Path = Path(CURRENT_PATH / "resources" / "sampleJava-1.0.0.zip")
RESOURCES_DOCS_ZIP_SAMPLE_PYTHON: Path = Path(CURRENT_PATH / "resources" / "samplePython-0.1.0.zip")


@pytest.fixture(scope="function")
def aws_credentials():
    """Mocked AWS Credentials for moto."""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"

@pytest.fixture(scope="function")
def s3(aws_credentials):
    """
    Return a mocked S3 client
    """
    with mock_aws():
        yield boto3.client("s3", region_name="us-east-1")

@pytest.fixture
def create_bucket(s3):
    s3.create_bucket(Bucket="bb1")

@pytest.fixture
def copy_resources_docs(tmp_path):
    """
    Copies resource zip files to temporary directories within tmp_path.

    Args:
        tmp_path (Path): Built-in pytest fixture providing a temporary directory.

    Returns:
        dict: A dictionary mapping resource directory names to the paths of the copied files.
    """
    resources_docs = {
        "python": RESOURCES_DOCS_ZIP_SAMPLE_PYTHON,
        "java": RESOURCES_DOCS_ZIP_SAMPLE_JAVA,
    }

    copied_paths = {}

    for resource_tmp_dir_name, resource_full_path in resources_docs.items():
        dst = tmp_path / "docs" / resource_tmp_dir_name
        dst.mkdir(parents=True, exist_ok=True)
        shutil.copy(src=resource_full_path, dst=dst)
        copied_file = dst / resource_full_path.name

        assert copied_file.exists(), f"File {copied_file} was not copied successfully."
        copied_paths[resource_tmp_dir_name] = copied_file

    return copied_paths


@pytest.mark.usefixtures("create_bucket")
class TestUnzipValidateUpload:
    def test_check_prerequisites(self, create_bucket, copy_resources_docs):
        """
        Checking necessary pre-requisites before tests:
        1. AWS mocks set up is correct.
        2. Resources are copied to the correct locations.
        """
        buckets_amount = boto3.client("s3").list_buckets()
        assert len(buckets_amount["Buckets"]) == 1, "There should be only 1 mock bucket created."
        assert Path(RESOURCES_DOCS_ZIP_SAMPLE_PYTHON).is_file(), f"Sample python docu should exist! {RESOURCES_DOCS_ZIP_SAMPLE_PYTHON}"
        assert Path(RESOURCES_DOCS_ZIP_SAMPLE_JAVA).is_file(), f"Sample java docu should exist! {RESOURCES_DOCS_ZIP_SAMPLE_JAVA}"

        for resource_dir, copied_file_path in copy_resources_docs.items():
            assert copied_file_path.exists(), f"Copied file for {resource_dir} does not exist."
            assert copied_file_path.is_file(), f"Copied path for {resource_dir} is not a file."

    def test_unpacked_doc_zip_has_desired_amount_of_files(self, create_bucket, copy_resources_docs):
        pass

    def test_s3_upload_file_count(self, create_bucket):
        pass

    def test_validation_passed_for_correct_zip(self, create_bucket):
        pass

    def test_validation_not_passed_for_incorrect_zip(self, create_bucket):
        pass