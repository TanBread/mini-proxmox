const os = require('os');
const { execSync } = require('child_process');

function safeExec(cmd) {
  try {
    return execSync(cmd, { timeout: 5000, encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

function getCpuInfo() {
  const cpus = os.cpus();
  const model = cpus[0]?.model?.replace(/\s+/g, ' ').trim() || 'Unknown';
  const speed = cpus[0]?.speed ? `${(cpus[0].speed / 1000).toFixed(2)} GHz` : null;
  const cores = os.cpus().length;
  // Try to get physical cores / threads from lscpu
  let threads = cores;
  let physicalCores = cores;
  const lscpu = safeExec('lscpu');
  if (lscpu) {
    const threadsMatch = lscpu.match(/Thread\(s\) per core:\s*(\d+)/);
    const coresMatch = lscpu.match(/Core\(s\) per socket:\s*(\d+)/);
    const socketsMatch = lscpu.match(/Socket\(s\):\s*(\d+)/);
    if (threadsMatch && coresMatch && socketsMatch) {
      physicalCores = parseInt(coresMatch[1]) * parseInt(socketsMatch[1]);
      threads = physicalCores * parseInt(threadsMatch[1]);
    }
  }
  return { model, speed, cores: physicalCores, threads };
}

function getMemoryInfo() {
  const total = os.totalmem();
  let speed = null;
  let ecc = null;
  let modules = [];

  // Try dmidecode for detailed RAM info (needs root)
  const dmidecode = safeExec('sudo dmidecode -t memory 2>/dev/null');
  if (dmidecode) {
    const speedMatches = dmidecode.match(/Speed:\s*(\d+)\s*MT\/s/g);
    if (speedMatches?.length) {
      const speeds = speedMatches.map((s) => parseInt(s.match(/(\d+)/)[1])).filter((n) => n > 0);
      if (speeds.length) speed = `${Math.max(...speeds)} MT/s`;
    }
    ecc = /Error Correction Type:\s*(Multi-bit|Single-bit|ECC)/i.test(dmidecode);
    // Count DIMM slots populated
    const sizeMatches = dmidecode.match(/Size:\s*(\d+)\s*GB/g);
    if (sizeMatches) {
      modules = sizeMatches
        .map((s) => parseInt(s.match(/(\d+)/)[1]))
        .filter((n) => n > 0)
        .map((gb) => `${gb} GB`);
    }
  }

  return { total, speed, ecc, modules: modules.length ? modules : null };
}

function getGpuInfo() {
  const gpus = [];
  // Try lspci for GPU info
  const lspci = safeExec('lspci 2>/dev/null | grep -i vga');
  if (lspci) {
    for (const line of lspci.split('\n')) {
      const name = line.replace(/^.*:\s*/, '').trim();
      if (name) gpus.push({ name, vram: null, speed: null });
    }
  }
  // Try to get VRAM from sysfs
  const drmCards = safeExec('ls /sys/class/drm/ 2>/dev/null | grep "^card[0-9]"');
  if (drmCards) {
    for (const card of drmCards.split('\n')) {
      const vramFile = safeExec(`cat /sys/class/drm/${card}/device/mem_info_vram_total 2>/dev/null`);
      if (vramFile && gpus.length) {
        const vramBytes = parseInt(vramFile);
        if (!isNaN(vramBytes) && vramBytes > 0) {
          const idx = drmCards.split('\n').indexOf(card);
          if (gpus[idx]) {
            gpus[idx].vram = vramBytes >= 1073741824
              ? `${(vramBytes / 1073741824).toFixed(1)} GB`
              : `${(vramBytes / 1048576).toFixed(0)} MB`;
          }
        }
      }
    }
  }
  return gpus;
}

function getStorageInfo() {
  let totalStorage = 0;
  let drives = [];

  // Use lsblk for drive info
  const lsblk = safeExec('lsblk -b -d -o NAME,SIZE,TYPE 2>/dev/null');
  if (lsblk) {
    const lines = lsblk.split('\n').slice(1);
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3 && parts[2] === 'disk') {
        const size = parseInt(parts[1]);
        if (!isNaN(size) && size > 0) {
          totalStorage += size;
          drives.push({
            name: parts[0],
            size: size >= 1073741824
              ? `${(size / 1073741824).toFixed(0)} GB`
              : `${(size / 1048576).toFixed(0)} MB`,
          });
        }
      }
    }
  }

  // Fallback: use df for total filesystem storage
  if (!drives.length) {
    const df = safeExec('df -B1 --output=size 2>/dev/null | tail -n +2 | awk \'{s+=$1} END {print s}\'');
    if (df) totalStorage = parseInt(df) || 0;
  }

  return { totalStorage, drives, driveCount: drives.length };
}

function getAppVersion() {
  return process.env.APP_VERSION || '1.3.1';
}

function getHardwareInfo() {
  const isLinux = os.platform() === 'linux';
  return {
    hostname: os.hostname(),
    user: os.userInfo().username,
    platform: os.platform(),
    arch: os.arch(),
    kernel: os.release(),
    appVersion: getAppVersion(),
    cpu: getCpuInfo(),
    memory: getMemoryInfo(),
    gpu: isLinux ? getGpuInfo() : [],
    storage: isLinux ? getStorageInfo() : { totalStorage: 0, drives: [], driveCount: 0 },
  };
}

module.exports = { getHardwareInfo };
