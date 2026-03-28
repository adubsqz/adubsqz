import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
// Always use a repo-local cache so a broken global/sandbox PLAYWRIGHT_BROWSERS_PATH cannot win.
process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(root, '.pw-browsers');

const cli = path.join(root, 'node_modules', '@playwright', 'test', 'cli.js');
const args = process.argv.slice(2);
const result = spawnSync(process.execPath, [cli, ...args], {
  stdio: 'inherit',
  env: process.env,
  cwd: root,
});

process.exit(result.status === null ? 1 : result.status);
