#!/bin/sh

docker run -it -e S3_ACCESS_KEY=$S3_ACCESS_KEY -e S3_SECRET=$S3_SECRET -e S3_CRAWLER_BUCKET=test -e STORE_PREFIX=xxx -e MINIO_URL=http://192.168.49.2:30900  --network minikube ttt