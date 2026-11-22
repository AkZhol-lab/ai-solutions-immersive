// PreToolUse (Read/Edit/Write): refuse any path that contains ".env". Exit 2 = blocked.
let raw = '';
process.stdin.on('data', (d) => (raw += d));
process.stdin.on('end', () => {
  let input = {};
  try {
    input = JSON.parse(raw || '{}');
  } catch {
    process.exit(0);
  }
  const ti = input.tool_input ?? {};
  const p = String(ti.file_path ?? ti.path ?? ti.notebook_path ?? '');
  if (p.includes('.env')) {
    console.error(`Blocked by project hook: "${p}" — .env files must not be read or edited.`);
    process.exit(2);
  }
  process.exit(0);
});
