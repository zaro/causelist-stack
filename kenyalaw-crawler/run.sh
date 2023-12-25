#!/bin/sh

set -e

if [ -z "$S3_ACCESS_KEY" -o -z "$S3_SECRET" ]; then
  echo "S3_ACCESS_KEY and S3_SECRET must be set"
  exit 1
fi

if [ -z "$S3_CRAWLER_BUCKET" ]; then
  echo "S3_CRAWLER_BUCKET must be set"
  exit 1
fi

if [ -z "$CRAWL_STORE_PREFIX" ]; then
  CRAWL_STORE_PREFIX=$(date -Is)
fi


if [ -z "$MINIO_URL" ]; then
  MINIO_URL=http://minio:9000
fi

mc alias set s3stor $MINIO_URL "$S3_ACCESS_KEY" "$S3_SECRET" --api S3v4

mkdir -p storage
if [ "$CRAWLER_TEST" = "job" ]; then
  echo "Job test run at $(date -Is)" > storage/log.txt
elif [ "$CRAWLER_TEST"  ]; then
  yarn start:dev >storage/log.txt 2>storage/error.txt
else
  yarn start:prod >storage/log.txt 2>storage/error.txt
fi

#
mc cp -q --recursive storage/ "s3stor/${S3_CRAWLER_BUCKET}/${CRAWL_STORE_PREFIX}/"

