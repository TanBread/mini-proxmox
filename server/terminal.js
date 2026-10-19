const pty = require('node-pty');
const os = require('os');

function createTerminal(ws) {
  const isWin = os.platform() === 'win32';
  const shell = isWin ? 'powershell.exe' : '/bin/bash';
  const args = isWin ? [] : ['-l'];

  const ptyProcess = pty.spawn(shell, args, {
    name: 'xterm-256color',
    cols: 120,
    rows: 30,
    cwd: isWin ? process.env.USERPROFILE || 'C:\\' : process.env.HOME || '/',
    env: { ...process.env, TERM: 'xterm-256color' },
  });

  ptyProcess.onData((data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'output', data }));
    }
  });

  ptyProcess.onExit(({ exitCode }) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'exit', code: exitCode }));
      ws.close();
    }
  });

  ws.on('message', (msg) => {
    try {
      const parsed = JSON.parse(msg.toString());
      switch (parsed.type) {
        case 'input':
          ptyProcess.write(parsed.data);
          break;
        case 'resize':
          if (parsed.cols > 0 && parsed.rows > 0) {
            ptyProcess.resize(parsed.cols, parsed.rows);
          }
          break;
      }
    } catch {
      // fallback: treat as raw input
      ptyProcess.write(msg.toString());
    }
  });

  ws.on('close', () => {
    try {
      ptyProcess.kill();
    } catch {
      // already dead
    }
  });

  ws.send(JSON.stringify({ type: 'ready', shell, platform: os.platform() }));
}

module.exports = { createTerminal };
