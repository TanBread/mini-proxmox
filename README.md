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

## Quick Start (Development)

```bash
# Terminal 1 — backend
cd server
npm install
npm run dev

# Terminal 2 — frontend (with proxy to :3000)
cd client
npm install
npm run dev
```

Open http://localhost:5173

## Login

| Username | Password | Role |
|----------|----------|------|
| admin | admin12345 | admin (full) |
| user | user123456 | user (read-only) |

## Deploy as Docker Container (Fedora/Ubuntu)

```bash
docker build -t mini-proxmox .
docker run -d --name mini-proxmox --restart=always --privileged \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /:/host \
  -e HOST_ROOT=/host \
  -e JWT_SECRET="your-long-random-secret" \
  mini-proxmox
```

Or with compose:

```bash
# Edit JWT_SECRET in docker-compose.yml first
docker compose up -d --build
```

Open http://your-server-ip:3000

## Stack

- **Backend:** Express, dockerode, node-pty, ws, JWT/bcrypt
- **Frontend:** React, Vite, Tailwind CSS, Recharts, xterm.js, Monaco Editor, lucide-react
