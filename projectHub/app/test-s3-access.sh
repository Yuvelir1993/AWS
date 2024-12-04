#!/bin/bash
echo "----------- Request 1 -----------"
echo ""
curl -i -L 'https://project-hub-bucket-green.s3.eu-central-1.amazonaws.com/projects/PythonApi0.1.0/docs/index.html' -H 'Access-Control-Request-Method: GET' -H 'Origin: http://188.146.36.4' --request OPTIONS
