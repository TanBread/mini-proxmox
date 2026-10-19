const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const isWin = os.platform() === 'win32';
// On Linux (production), host is mounted at /host; on Windows dev, use C:\
const HOST_ROOT = process.env.HOST_ROOT || (isWin ? 'C:\\' : '/host');

function resolvePath(rel) {
  const clean = (rel || '/').replace(/^\/+/, '');
  const full = path.resolve(HOST_ROOT, clean);
  // Prevent escaping host root
  if (!full.startsWith(path.resolve(HOST_ROOT))) {
    throw new Error('Access denied: path escapes host root');
  }
  return full;
}

async function listDirectory(rel) {
  const dir = resolvePath(rel);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const items = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      let size = 0;
      let modified = null;
      let isDir = entry.isDirectory();
      try {
        const stat = await fs.stat(full);
        size = stat.size;
        modified = stat.mtime;
        isDir = stat.isDirectory();
      } catch {
        // permission error etc.
      }
      return {
        name: entry.name,
        path: path.posix.join((rel || '/').replace(/\\/g, '/'), entry.name),
        isDir,
        isSymlink: entry.isSymbolicLink(),
        size,
        modified,
      };
    })
  );
  items.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return items;
}

async function readFile(rel) {
  const file = resolvePath(rel);
  const stat = await fs.stat(file);
  if (stat.isDirectory()) throw new Error('Is a directory');
  if (stat.size > 5 * 1024 * 1024) throw new Error('File too large (max 5MB)');
  const content = await fs.readFile(file, 'utf-8');
  return { content, size: stat.size, modified: stat.mtime };
}

async function writeFile(rel, content) {
  const file = resolvePath(rel);
  await fs.writeFile(file, content, 'utf-8');
  return { success: true };
}

async function createDirectory(rel) {
  const dir = resolvePath(rel);
  await fs.mkdir(dir, { recursive: true });
  return { success: true };
}

async function deletePath(rel) {
  const target = resolvePath(rel);
  const stat = await fs.stat(target);
  if (stat.isDirectory()) {
    await fs.rm(target, { recursive: true, force: true });
  } else {
    await fs.unlink(target);
  }
  return { success: true };
}

async function getFileInfo(rel) {
  const target = resolvePath(rel);
  const stat = await fs.stat(target);
  return {
    name: path.basename(target),
    path: rel,
    isDir: stat.isDirectory(),
    size: stat.size,
    modified: stat.mtime,
    created: stat.birthtime,
    mode: stat.mode.toString(8),
  };
}

module.exports = { listDirectory, readFile, writeFile, createDirectory, deletePath, getFileInfo, HOST_ROOT };
