#!/bin/sh

mkdir -p app/src/api
cp -vr -t app/src/api causelist-api/src/interfaces/*
cp -vr -t kenyalaw-crawler/src/interfaces causelist-api/src/interfaces/*