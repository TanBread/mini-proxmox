#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "Pulling latest code..."
git pull

echo "Building image..."
docker build -t mini-proxmox .

echo "Restarting container..."
docker stop mini-proxmox 2>/dev/null || true
docker rm mini-proxmox 2>/dev/null || true

docker run -d --name mini-proxmox --restart=always --privileged --pid=host \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /:/host \
  -e HOST_ROOT=/host \
  mini-proxmox

echo "Done! Open http://localhost:3000"
