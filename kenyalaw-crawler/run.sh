#!/bin/sh

if [ -z "$S3_ACCESS_KEY" -o -z "$S3_SECRET" -o -z "$S3_REGION"  -o -z "$S3_ENDPOINT" ]; then
  echo "S3_REGION, S3_ENDPOINT, S3_ACCESS_KEY and S3_SECRET must be set"
  exit 1
fi

if [ -z "$S3_CRAWLER_BUCKET" ]; then
  echo "S3_CRAWLER_BUCKET must be set"
  exit 1
fi

V=prod
if [ "$CRAWLER_TEST" ]; then
  V=dev
fi

STORAGE_DIR=storage

mkdir -p ${STORAGE_DIR}
if [ "$CRAWLER_TEST" = "job" ]; then
  mkdir -p ${STORAGE_DIR}/request_queues/default/
  touch ${STORAGE_DIR}/request_queues/default/dummy.json
  echo "Job test run at $(date -Is)" > ${STORAGE_DIR}/crawler.log.txt
else
  echo "Start crawler in ${V}"
  yarn start:${V} ${STORAGE_DIR} > ${STORAGE_DIR}/crawler.log.txt 2>${STORAGE_DIR}/crawler.error.txt
  echo "Start process data in ${V}"
  yarn process:${V} ${STORAGE_DIR} > ${STORAGE_DIR}/process.log.txt 2>${STORAGE_DIR}/process.error.txt
fi

echo "Uploading logs..."
yarn upload-logs:${V} ${STORAGE_DIR}
