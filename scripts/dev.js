const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

function startProcess(name, cmd, args, cwd) {
  const isWin = process.platform === 'win32';
  const executable = isWin ? `${cmd}.cmd` : cmd;

  const child = spawn(executable, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
  });

  child.on('error', (err) => {
    console.error(`[${name}] Error:`, err);
  });

  child.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`[${name}] Process exited with code ${code}`);
    }
  });

  return child;
}

console.log('🛡️  Starting DevSphere Security Platform (API on :4000 & Web on :3000)...');

const api = startProcess('API', 'npm', ['run', 'dev'], path.join(root, 'apps', 'api'));
const web = startProcess('WEB', 'npm', ['run', 'dev'], path.join(root, 'apps', 'web'));

function cleanup() {
  try { api.kill(); } catch {}
  try { web.kill(); } catch {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
