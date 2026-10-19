# mini-proxmox

<!-- use these signs to stop stuff from showing up -->

A Proxmox-style web dashboard for managing your Docker server.

## Deploying on Fedora

```bash
# Install Docker
sudo dnf -y install dnf-plugins-core
sudo dnf config-manager addrepo --from-repofile=https://download.docker.com/linux/fedora/docker-ce.repo
sudo dnf -y install docker-ce docker-ce-cli containerd.io
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker

# Run mini-proxmox
git clone https://github.com/TanBread/mini-proxmox.git
cd mini-proxmox
docker build -t mini-proxmox .
docker run -d --privileged --pid=host -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /:/host -e HOST_ROOT=/host \
  mini-proxmox
```

Open [localhost:3000](http://localhost:3000) — login: `admin` / `admin12345`

## Deploying on Ubuntu

```bash
curl -fsSL https://get.docker.com | sh
git clone https://github.com/TanBread/mini-proxmox.git
cd mini-proxmox
docker build -t mini-proxmox .
docker run -d --privileged --pid=host -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /:/host -e HOST_ROOT=/host \
  mini-proxmox
```

Open [localhost:3000](http://localhost:3000) — login: `admin` / `admin12345`

## How to Update

```bash
cd && cd mini-proxmox && git pull && ./update.sh
```

<!-- ## Features

Dashboard, Containers, Images, Networks, Volumes, Terminal (with sudo), File editor, Logs.

| Username | Password | Role |
|----------|----------|------|
| admin | admin12345 | full access |
| user | user123456 | read-only |
-->