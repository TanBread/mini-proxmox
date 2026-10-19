const os = require('os');
const fs = require('fs');
const { execSync } = require('child_process');

let lastNet = null;

function getNetworkBytes() {
  try {
    const data = fs.readFileSync('/proc/net/dev', 'utf-8');
    let rx = 0;
    let tx = 0;
    for (const line of data.split('\n').slice(2)) {
      const parts = line.trim().split(/[\s:]+/);
      if (parts.length < 17) continue;
      const iface = parts[0];
      if (iface === 'lo') continue;
      rx += parseInt(parts[1]) || 0;
      tx += parseInt(parts[9]) || 0;
    }
    return { rx, tx };
  } catch {
    // Fallback: use os.networkInterfaces (cumulative not available, return null)
    return null;
  }
}

function getNetRates() {
  const current = getNetworkBytes();
  if (!current) return { rxRate: null, txRate: null, rx: null, tx: null };
  const now = Date.now();
  let rxRate = null;
  let txRate = null;
  if (lastNet && now - lastNet.time > 0) {
    const elapsed = (now - lastNet.time) / 1000;
    rxRate = Math.max(0, (current.rx - lastNet.rx) / elapsed);
    txRate = Math.max(0, (current.tx - lastNet.tx) / elapsed);
  }
  lastNet = { ...current, time: now };
  return { rxRate, txRate, rx: current.rx, tx: current.tx };
}

function getGpuUsage() {
  // Try nvidia-smi first
  try {
    const out = execSync(
      'nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total --format=csv,noheader,nounits',
      { timeout: 3000, encoding: 'utf-8' }
    ).trim();
    const first = out.split('\n')[0];
    const [util, memUsed, memTotal] = first.split(',').map((s) => parseInt(s.trim()));
    if (!isNaN(util)) {
      return { usage: util, memUsed: memUsed ?? null, memTotal: memTotal ?? null, name: null };
    }
  } catch {}

  // Try amd-gpu top (rare) - fallback: read drm busy percent if available
  try {
    const cards = fs.readdirSync('/sys/class/drm').filter((c) => /^card\d+$/.test(c));
    for (const card of cards) {
      const gpuBusy = `/sys/class/drm/${card}/device/gpu_busy_percent`;
      if (fs.existsSync(gpuBusy)) {
        const util = parseInt(fs.readFileSync(gpuBusy, 'utf-8').trim());
        if (!isNaN(util)) return { usage: util, memUsed: null, memTotal: null, name: card };
      }
    }
  } catch {}

  return null;
}

function getStatsSnapshot() {
  const net = getNetRates();
  const gpu = getGpuUsage();
  return {
    netRxRate: net.rxRate,
    netTxRate: net.txRate,
    gpu,
    timestamp: Date.now(),
  };
}

module.exports = { getStatsSnapshot };
