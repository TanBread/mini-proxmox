#!/usr/bin/env bash
set -e

REPO="https://github.com/TanBread/mini-proxmox.git"
DIR="$HOME/mini-proxmox"
IMAGE="mini-proxmox"
CONTAINER="mini-proxmox"

echo "==> Checking Docker..."
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found, installing..."
  curl -fsSL https://get.docker.com | sh
  sudo systemctl enable --now docker
else
  echo "Docker found, updating..."
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -qq && sudo apt-get upgrade -y docker-ce docker-ce-cli containerd.io 2>/dev/null || true
  fi
fi

if ! docker info >/dev/null 2>&1; then
  echo "Adding user to docker group (log out/in may be needed)..."
  sudo usermod -aG docker "$USER"
  echo "Run the script again after re-login, or run: newgrp docker"
  exit 1
fi

echo "==> Cloning repo..."
if [ -d "$DIR/.git" ]; then
  git -C "$DIR" fetch origin
  # Old clones may still be on master; switch to main
  if git -C "$DIR" show-ref --verify --quiet refs/heads/main || git -C "$DIR" show-ref --verify --quiet refs/remotes/origin/main; then
    git -C "$DIR" branch -m "$(git -C "$DIR" branch --show-current)" main 2>/dev/null || true
    git -C "$DIR" branch -u origin/main main 2>/dev/null || true
    git -C "$DIR" checkout main 2>/dev/null || true
  fi
  git -C "$DIR" pull --ff-only || true
else
  git clone "$REPO" "$DIR"
fi

echo "==> Building image..."
docker build -t "$IMAGE" "$DIR"

echo "==> Running container..."
docker rm -f "$CONTAINER" 2>/dev/null || true
docker run -d \
  --name "$CONTAINER" \
  --privileged \
  --pid=host \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /:/host \
  -e HOST_ROOT=/host \
  -e HOST_USER="$USER" \
  "$IMAGE"

echo "Done! Open http://localhost:3000 — login: admin / admin12345"
