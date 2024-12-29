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
    def test_mocked_bucket_created(self, create_bucket):
        result = boto3.client("s3").list_buckets()
        assert len(result["Buckets"]) == 1
    def test_unpacked_zip_has_desired_amount_of_files(self, create_bucket):
        pass
    def test_s3_upload_file_count(self, create_bucket):
        pass
    def test_validation_passed_for_correct_zip(self, create_bucket):
        pass
    def test_validation_not_passed_for_incorrect_zip(self, create_bucket):
        pass