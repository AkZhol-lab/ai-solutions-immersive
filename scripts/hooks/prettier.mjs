// PostToolUse (Edit/Write): format the changed file with the project's Prettier.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const EXT = /\.(ts|js|mjs|cjs|json|css|html|md|glsl)$/i;
const SKIP = /[\\/](node_modules|dist|screens)[\\/]/;

let raw = '';
process.stdin.on('data', (d) => (raw += d));
process.stdin.on('end', () => {
  let file = '';
  try {
    const input = JSON.parse(raw || '{}');
    file = String(input.tool_input?.file_path ?? '');
  } catch {
    process.exit(0);
  }
  if (!file || !EXT.test(file) || SKIP.test(file) || !existsSync(file)) process.exit(0);
  const abs = path.resolve(file);
  if (!abs.startsWith(root)) process.exit(0);
  // glsl has no prettier parser — skip silently
  if (/\.glsl$/i.test(abs)) process.exit(0);
  const bin = path.join(root, 'node_modules', 'prettier', 'bin', 'prettier.cjs');
  if (!existsSync(bin)) process.exit(0);
  const r = spawnSync(process.execPath, [bin, '--write', '--log-level', 'warn', abs], {
    cwd: root,
    encoding: 'utf8',
  });
  if (r.status !== 0) console.error(`prettier: ${r.stderr || r.stdout}`);
  process.exit(0); // never block an edit because of formatting
});
