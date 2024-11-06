!/bin/bash
cd ../
API_PORT=5001
DOCKER_BUILDKIT=1 docker build --target=runtime --build-arg API_PORT="$API_PORT" -t s3-api-slim/1.0.0 .
docker run -it -p $API_PORT:$API_PORT s3-api-slim/1.0.0