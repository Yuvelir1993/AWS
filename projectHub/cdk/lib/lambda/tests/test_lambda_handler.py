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

CURRENT_PATH = Path(os.path.dirname(os.path.realpath(__file__)))

RESOURCES_DOCS_ZIP_SAMPLE_JAVA = CURRENT_PATH / "resources" / "sampleJava-1.0.0.zip"
RESOURCES_DOCS_ZIP_SAMPLE_PYTHON = CURRENT_PATH / "resources" / "samplePython-0.1.0.zip"


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

@pytest.mark.usefixtures("create_bucket")
class TestUnzipValidateUpload:
    def test_check_prerequisites(self, create_bucket):
        """
        Checking necessary pre-requisites before tests.
        """
        buckets_amount = boto3.client("s3").list_buckets()
        assert len(buckets_amount["Buckets"]) == 1, "There should be only 1 mock bucket created."
        assert Path(RESOURCES_DOCS_ZIP_SAMPLE_PYTHON).is_file(), f"Sample python docu should exist! {RESOURCES_DOCS_ZIP_SAMPLE_PYTHON}"
        assert Path(RESOURCES_DOCS_ZIP_SAMPLE_JAVA).is_file(), f"Sample java docu should exist! {RESOURCES_DOCS_ZIP_SAMPLE_JAVA}"


    def test_unpacked_python_doc_zip_has_desired_amount_of_files(self, create_bucket, tmp_path):
        d = tmp_path / "docs_python_unpacked"
        d.mkdir()
        pass

    def test_unpacked_java_doc_zip_has_desired_amount_of_files(self, create_bucket, tmp_path):
        d = tmp_path / "docs_java_unpacked"
        d.mkdir()
        pass

    def test_s3_upload_file_count(self, create_bucket):
        pass

    def test_validation_passed_for_correct_zip(self, create_bucket):
        pass

    def test_validation_not_passed_for_incorrect_zip(self, create_bucket):
        pass