#!/bin/bash

# Update and install Apache
yum update -y
yum install -y httpd
systemctl enable httpd
systemctl start httpd

echo "window.PROJECT_HUB_DOC_LINKS_URL = 's3://$PROJECT_HUB_DOC_LINKS_URL';" > /var/www/html/config.js

# Create and access the temp directory
mkdir /temp
cd /temp

# Download the website zip file from S3
# aws s3 cp s3://project-hub-bucket-green/projectHubWeb/projectHubWeb.zip projectHubWeb.zip
aws s3 cp s3://$PROJECT_HUB_WEB_S3_ZIP_PATH projectHubWeb.zip

# Unzip the project files and move them to /var/www/html
unzip projectHubWeb.zip
cd projectHubWeb
mv * /var/www/html/

# Ensure the web server is serving content
systemctl restart httpd