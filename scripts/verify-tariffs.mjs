// Compares src/data/tariffs.ts with AI_Solutions_Тарифы.xlsx row by row.
// No dependencies: unzips the xlsx with zlib and reads the sheet XML directly.
// Exit code 1 on any mismatch.
import { readFileSync, readdirSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const xlsxName = readdirSync(root).find((f) => f.toLowerCase().endsWith('.xlsx'));
if (!xlsxName) {
  console.error('verify-tariffs: no .xlsx in project root');
  process.exit(1);
}

function unzip(buf) {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = {};
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28);
    const xlen = buf.readUInt16LE(p + 30);
    const clen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nlen);
    const lnl = buf.readUInt16LE(local + 26);
    const lxl = buf.readUInt16LE(local + 28);
    const data = buf.subarray(local + 30 + lnl + lxl, local + 30 + lnl + lxl + csize);
    files[name] = (method === 8 ? inflateRawSync(data) : data).toString('utf8');
    p += 46 + nlen + xlen + clen;
  }
  return files;
}

const decode = (s) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&');
const textOf = (xml) =>
  decode([...xml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join(''));

const files = unzip(readFileSync(path.join(root, xlsxName)));
const shared = files['xl/sharedStrings.xml']
  ? [...files['xl/sharedStrings.xml'].matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1]))
  : [];
const cells = {};
for (const m of files['xl/worksheets/sheet1.xml'].matchAll(
  /<c r="([A-Z]+)(\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g,
)) {
  const [, col, row, attrs, inner = ''] = m;
  const type = /t="(\w+)"/.exec(attrs)?.[1];
  let v;
  if (type === 'inlineStr') v = textOf(inner);
  else {
    const raw = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1];
    v = raw === undefined ? undefined : type === 's' ? shared[Number(raw)] : decode(raw);
  }
  if (v !== undefined && v !== '') (cells[col] ??= []).push({ row: Number(row), v: String(v) });
}

function parseColumn(col) {
  const all = cells[col].sort((a, b) => a.row - b.row).map((c) => c.v);
  // the tariff header is the row right above a numeric price
  const start = all.findIndex((v, i) => /^\d+$/.test(all[i + 1] ?? ''));
  const rows = all.slice(start);
  const out = {
    name: rows[0],
    price: rows[1],
    period: rows[2],
    blocks: [],
    volume: '',
    counts: {},
  };
  let section = '';
  for (const r of rows.slice(3)) {
    if (/^\d\s·\s/.test(r)) {
      section = r;
      continue;
    }
    if (section.includes('ДЛЯ КОГО')) out.audience = r;
    else if (section.includes('СОСТАВ')) {
      if (r.startsWith('◆')) out.blocks.push({ title: r.replace(/^◆\s*/, ''), tasks: [] });
      else out.blocks.at(-1).tasks.push(r.replace(/^·\s*/, ''));
    } else if (section.includes('ОБЪЁМ')) {
      const m = /^(Блоков|Задач):\s*(\d+)/.exec(r);
      if (m) out.counts[m[1]] = Number(m[2]);
      else if (!out.volume) out.volume = r;
    }
  }
  return out;
}

const { TARIFFS, blockCount, taskCount } = await import(
  pathToFileURL(path.join(root, 'src/data/tariffs.ts')).href
);

const errors = [];
const eq = (label, a, b) => {
  if (a !== b)
    errors.push(`${label}\n    xlsx: ${JSON.stringify(a)}\n    ts:   ${JSON.stringify(b)}`);
};

['B', 'D', 'F'].forEach((col, i) => {
  const x = parseColumn(col);
  const t = TARIFFS[i];
  const id = `${x.name}`;
  eq(`${id} name`, x.name, t.name);
  eq(`${id} price`, x.price, String(t.price));
  eq(`${id} period`, x.period, t.period);
  eq(`${id} audience`, x.audience, t.audience);
  eq(`${id} volume`, x.volume, t.volume);
  eq(`${id} block count`, x.blocks.length, t.blocks.length);
  x.blocks.forEach((b, j) => {
    const tb = t.blocks[j] ?? { title: undefined, tasks: [] };
    eq(`${id} block ${j + 1} title`, b.title, tb.title);
    eq(`${id} block ${j + 1} task count`, b.tasks.length, tb.tasks.length);
    b.tasks.forEach((task, k) => eq(`${id} block ${j + 1} task ${k + 1}`, task, tb.tasks[k]));
  });
  if (x.counts['Блоков'] !== undefined)
    eq(`${id} «Блоков» in xlsx vs computed`, x.counts['Блоков'], blockCount(t));
  if (x.counts['Задач'] !== undefined)
    eq(`${id} «Задач» in xlsx vs computed`, x.counts['Задач'], taskCount(t));
  console.log(
    `${t.name.padEnd(8)} ${String(t.price).padStart(4)} ${t.period.padEnd(8)} блоков ${blockCount(t)} · задач ${taskCount(t)}`,
  );
});

if (errors.length) {
  console.error(
    `\n✗ ${errors.length} mismatch(es) between ${xlsxName} and tariffs.ts:\n  ` +
      errors.join('\n  '),
  );
  process.exit(1);
}
console.log(`\n✓ tariffs.ts matches ${xlsxName}`);
