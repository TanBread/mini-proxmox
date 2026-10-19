const pty = require('node-pty');
const os = require('os');

function createTerminal(ws) {
  const isWin = os.platform() === 'win32';
  const hostRoot = process.env.HOST_ROOT;
  const shell = isWin ? 'powershell.exe' : '/bin/bash';
  const args = isWin ? [] : ['-l'];
  // When running in container (HOST_ROOT=/host), use nsenter to get a real host shell
  const inContainer = !isWin && hostRoot && hostRoot !== '/';

  let spawnShell = shell;
  let spawnArgs = args;
  let cwd = isWin
    ? process.env.USERPROFILE || 'C:\\'
    : process.env.HOME || '/';

  if (inContainer) {
    // Enter host namespaces (requires --pid=host on the container)
    const hostUser = process.env.HOST_USER;
    spawnShell = 'nsenter';
    spawnArgs = hostUser
      ? ['-t', '1', '-m', '-u', '-i', '-n', '-p', '--', 'su', '-', hostUser]
      : ['-t', '1', '-m', '-u', '-i', '-n', '-p', '--', '/bin/bash', '-l'];
    cwd = '/';
  }

  const ptyProcess = pty.spawn(spawnShell, spawnArgs, {
    name: 'xterm-256color',
    cols: 120,
    rows: 30,
    cwd,
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
