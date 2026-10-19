require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const { authenticate, requireAuth, requireAdmin } = require('./auth');
const docker = require('./docker');
const files = require('./files');
const { createTerminal } = require('./terminal');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ---------- Auth ----------
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const result = authenticate(username, password);
  if (!result) return res.status(401).json({ error: 'Invalid credentials' });
  res.json(result);
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ---------- System ----------
app.get('/api/system/info', requireAuth, async (req, res) => {
  try {
    res.json(await docker.getSystemInfo());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/system/df', requireAuth, async (req, res) => {
  try {
    res.json(await docker.getSystemDf());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/system/prune', requireAuth, requireAdmin, async (req, res) => {
  try {
    res.json(await docker.systemPrune());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- Containers ----------
app.get('/api/containers', requireAuth, async (req, res) => {
  try {
    res.json(await docker.listContainers(true));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/containers/:id', requireAuth, async (req, res) => {
  try {
    res.json(await docker.inspectContainer(req.params.id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/containers/:id/stats', requireAuth, async (req, res) => {
  try {
    res.json(await docker.getContainerStats(req.params.id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/containers', requireAuth, requireAdmin, async (req, res) => {
  try {
    res.json(await docker.createContainer(req.body));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/containers/:id/start', requireAuth, requireAdmin, async (req, res) => {
  try {
    res.json(await docker.startContainer(req.params.id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/containers/:id/stop', requireAuth, requireAdmin, async (req, res) => {
  try {
    res.json(await docker.stopContainer(req.params.id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/containers/:id/restart', requireAuth, requireAdmin, async (req, res) => {
  try {
    res.json(await docker.restartContainer(req.params.id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/containers/:id/pause', requireAuth, requireAdmin, async (req, res) => {
  try {
    res.json(await docker.pauseContainer(req.params.id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/containers/:id/unpause', requireAuth, requireAdmin, async (req, res) => {
  try {
    res.json(await docker.unpauseContainer(req.params.id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/containers/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    res.json(await docker.removeContainer(req.params.id, req.query.force === 'true'));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- Images ----------
app.get('/api/images', requireAuth, async (req, res) => {
  try {
    res.json(await docker.listImages());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/images/pull', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { tag } = req.body;
    if (!tag) return res.status(400).json({ error: 'Image tag required' });
    res.json(await docker.pullImage(tag));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/images/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    res.json(await docker.removeImage(req.params.id, req.query.force === 'true'));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- Networks ----------
app.get('/api/networks', requireAuth, async (req, res) => {
  try {
    res.json(await docker.listNetworks());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/networks', requireAuth, requireAdmin, async (req, res) => {
  try {
    res.json(await docker.createNetwork(req.body));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/networks/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    res.json(await docker.removeNetwork(req.params.id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- Volumes ----------
app.get('/api/volumes', requireAuth, async (req, res) => {
  try {
    res.json(await docker.listVolumes());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/volumes', requireAuth, requireAdmin, async (req, res) => {
  try {
    res.json(await docker.createVolume(req.body));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/volumes/:name', requireAuth, requireAdmin, async (req, res) => {
  try {
    res.json(await docker.removeVolume(req.params.name, req.query.force === 'true'));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- Files ----------
app.get('/api/files', requireAuth, async (req, res) => {
  try {
    res.json(await files.listDirectory(req.query.path || '/'));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/files/read', requireAuth, async (req, res) => {
  try {
    res.json(await files.readFile(req.query.path));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/files/write', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    res.json(await files.writeFile(filePath, content));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/files/mkdir', requireAuth, requireAdmin, async (req, res) => {
  try {
    res.json(await files.createDirectory(req.body.path));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/files', requireAuth, requireAdmin, async (req, res) => {
  try {
    res.json(await files.deletePath(req.query.path));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- Log streaming (raw, not JSON) ----------
app.get('/api/containers/:id/logs', requireAuth, async (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('X-Accel-Buffering', 'no');
    const stream = docker.streamContainerLogs(req.params.id, {
      follow: req.query.follow === 'true',
      tail: parseInt(req.query.tail || '100', 10),
      timestamps: req.query.timestamps === 'true',
    });
    stream.on('data', (chunk) => {
      // Docker multiplexes stdout/stderr with 8-byte headers when not TTY;
      // strip headers if present
      let buf = chunk;
      if (buf.length > 8 && buf[0] <= 2) {
        // Possible header: [stream][0][0][0][size4]
        const size = buf.readUInt32BE(4);
        if (size === buf.length - 8) {
          buf = buf.slice(8);
        }
      }
      res.write(buf);
    });
    stream.on('end', () => res.end());
    stream.on('error', (e) => {
      res.write(`\n[error] ${e.message}\n`);
      res.end();
    });
    req.on('close', () => stream.destroy());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- WebSocket ----------
server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/ws/terminal') {
    // Basic token check via query param
    const token = url.searchParams.get('token');
    const { verifyToken } = require('./auth');
    if (!token || !verifyToken(token)) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      createTerminal(ws);
    });
  } else if (url.pathname === '/ws/stats') {
    const token = url.searchParams.get('token');
    const { verifyToken } = require('./auth');
    if (!token || !verifyToken(token)) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    const statsWss = new WebSocketServer({ noServer: true });
    statsWss.handleUpgrade(req, socket, head, (ws) => {
      handleStatsStream(ws);
    });
  } else {
    socket.destroy();
  }
});

async function handleStatsStream(ws) {
  let stream = null;
  let containerId = null;

  ws.on('message', async (msg) => {
    try {
      const parsed = JSON.parse(msg.toString());
      if (parsed.type === 'subscribe' && parsed.id) {
        containerId = parsed.id;
        if (stream) stream.destroy();
        stream = docker.streamStats(containerId);
        stream.on('data', (chunk) => {
          try {
            const stats = JSON.parse(chunk.toString());
            const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
            const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
            const cpuCount = stats.cpu_stats.online_cpus || 1;
            const cpuPercent = systemDelta > 0 ? ((cpuDelta / systemDelta) * cpuCount) * 100 : 0;
            ws.send(
              JSON.stringify({
                type: 'stats',
                id: containerId,
                cpuPercent: Math.round(cpuPercent * 100) / 100,
                memUsage: stats.memory_stats.usage || 0,
                memLimit: stats.memory_stats.limit || 0,
                netRx: stats.networks ? Object.values(stats.networks).reduce((a, n) => a + n.rx_bytes, 0) : 0,
                netTx: stats.networks ? Object.values(stats.networks).reduce((a, n) => a + n.tx_bytes, 0) : 0,
              })
            );
          } catch {
            // partial chunk
          }
        });
        stream.on('error', () => {});
      }
    } catch {}
  });

  ws.on('close', () => {
    if (stream) stream.destroy();
  });
}

// ---------- Serve static client (production) ----------
const path = require('path');
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get(/^\/(?!api|ws).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) res.status(404).send('Client not built. Run: cd client && npm run build');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`mini-proxmox server running on http://0.0.0.0:${PORT}`);
});
