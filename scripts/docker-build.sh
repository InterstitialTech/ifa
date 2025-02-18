#!/usr/bin/env bash

# This script builds Docker images from the local
# repository and tag them as development version.

export BENETECH_MODE=""

if [ -f ".env" ]; then
  source .env
fi

if [ "$BENETECH_MODE" = "-dev" ]; then
  set -x
  sudo docker-compose rm -s -f
  sudo docker-compose build --build-arg GIT_HASH="$(git rev-parse --short HEAD)" --parallel "$@"
else
  set -x
  sudo docker build --build-arg GIT_HASH="$(git rev-parse --short HEAD)" "$@" -t "johnhbenetech/videodeduplication:${BENETECH_RUNTIME:-gpu}-dev" . -f "docker/Dockerfile.dedup-${BENETECH_RUNTIME:-gpu}"
  sudo docker build --build-arg GIT_HASH="$(git rev-parse --short HEAD)" "$@" -t "johnhbenetech/videodeduplication:server-dev" . -f "docker/Dockerfile.server"
fi
