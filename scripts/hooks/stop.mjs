// Stop: 1) npm run build — on failure, block the stop and hand the error back to Claude (exit 2);
//       2) Playwright screenshots of every scene at 1440 / 390 → /screens.
// The two steps run in one hook on purpose: hooks of one event run in parallel,
// and the screenshots need the fresh build.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

let raw = '';
process.stdin.on('data', (d) => (raw += d));
process.stdin.on('end', () => {
  let input = {};
  try {
    input = JSON.parse(raw || '{}');
  } catch {
    /* ignore */
  }

  const build = spawnSync('npm run build', { cwd: root, shell: true, encoding: 'utf8' });
  if (build.status !== 0) {
    const out = `${build.stdout ?? ''}\n${build.stderr ?? ''}`
      .trim()
      .split('\n')
      .slice(-40)
      .join('\n');
    if (input.stop_hook_active) {
      // already retried once in this stop cycle: surface it, don't loop forever
      console.log(JSON.stringify({ systemMessage: `npm run build still fails:\n${out}` }));
      process.exit(0);
    }
    console.error(`npm run build failed — fix it before finishing:\n${out}`);
    process.exit(2);
  }

  const shots = spawnSync(process.execPath, [path.join(root, 'scripts', 'screens.mjs')], {
    cwd: root,
    encoding: 'utf8',
  });
  const summary = `${shots.stdout ?? ''}${shots.stderr ?? ''}`
    .trim()
    .split('\n')
    .slice(-12)
    .join('\n');
  console.log(JSON.stringify({ systemMessage: `build ok · screens:\n${summary}` }));
  process.exit(0);
});
