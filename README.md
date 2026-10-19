# mini-proxmox

A Proxmox-style web dashboard for managing your Docker server. Built with Node.js + React.

## Features

- **Dashboard** — CPU/RAM charts, container/image/network/volume summaries
- **Containers** — create, start, stop, restart, delete, inspect
- **Images** — list, pull, delete
- **Networks** — list, create, delete
- **Volumes** — list, create, delete
- **Terminal** — web terminal with sudo (full host shell)
- **Files** — browse and edit host filesystem with Monaco editor
- **Logs** — stream container logs with follow mode
- **Auth** — JWT with two roles: `admin` (full access) and `user` (read-only)

## Login

| Username | Password | Role |
|----------|----------|------|
| admin | admin12345 | admin (full) |
| user | user123456 | user (read-only) |

---

## Deploy on Fedora — copy & paste

### Step 1: Install Docker

```bash
sudo dnf -y install dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
sudo dnf -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
```

Verify Docker works:

```bash
sudo docker run hello-world
```

### Step 2: Deploy mini-proxmox

```bash
git clone https://github.com/TanBread/mini-proxmox.git
cd mini-proxmox
docker build -t mini-proxmox .
docker run -d --name mini-proxmox --restart=always --privileged \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /:/host \
  -e HOST_ROOT=/host \
  -e JWT_SECRET="change-this-to-a-long-random-string" \
  mini-proxmox
```

### Step 3: Open it

```
http://your-server-ip:3000
```

Log in with `admin` / `admin12345`.

---

## Deploy on Ubuntu/Debian

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Deploy
git clone https://github.com/TanBread/mini-proxmox.git
cd mini-proxmox
docker build -t mini-proxmox .
docker run -d --name mini-proxmox --restart=always --privileged \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /:/host \
  -e HOST_ROOT=/host \
  -e JWT_SECRET="change-this-to-a-long-random-string" \
  mini-proxmox
```

Open `http://your-server-ip:3000`.

---

## Deploy with Docker Compose

Edit `docker-compose.yml` and set your own `JWT_SECRET`, then:

```bash
docker compose up -d --build
```

---

## Development (Windows/Mac/Linux)

```bash
# Terminal 1 — backend
cd server
npm install
npm run dev

# Terminal 2 — frontend
cd client
npm install
npm run dev
```

Open http://localhost:5173

---

## Useful Commands

```bash
# View logs
docker logs -f mini-proxmox

# Stop
docker stop mini-proxmox

# Start
docker start mini-proxmox

# Update (after git pull)
docker build -t mini-proxmox .
docker stop mini-proxmox && docker rm mini-proxmox
docker run -d --name mini-proxmox --restart=always --privileged \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /:/host \
  -e HOST_ROOT=/host \
  -e JWT_SECRET="change-this-to-a-long-random-string" \
  mini-proxmox
```

## Stack

- **Backend:** Express, dockerode, node-pty, ws, JWT/bcrypt
- **Frontend:** React, Vite, Tailwind CSS, Recharts, xterm.js, Monaco Editor, lucide-react
