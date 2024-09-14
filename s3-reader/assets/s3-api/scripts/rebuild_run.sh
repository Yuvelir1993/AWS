!/bin/bash
cd ../
DOCKER_BUILDKIT=1 docker build --target=runtime -t s3-api-slim/1.0.0 .
docker run -it -p 5000:5000 s3-api-slim/1.0.0