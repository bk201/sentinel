#!/bin/bash -e

docker build -t video-generator .

docker run --rm -v $(pwd):/app video-generator
