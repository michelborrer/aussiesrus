/**
 * FIX 2 — fail the build if collapsed whitespace around figures/links ships in dist/.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist');
const PROBES = [/from1 /, /of\$/, /first14/, /attracts15/, /in2030/, /a10 kWh/, /the\[/];
// letter immediately abutting a fig span or an anchor (prose bug class)
const ADJACENT = /[a-zA-Z]<span class="fig"|[a-zA-Z]<a |<\/span>[a-zA-Z]|<\/a>[a-zA-Z]/g;

function collectHtml(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) collectHtml(full, out);
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

const pages = collectHtml(DIST);
if (!pages.length) {
  console.error('No HTML in dist/. Build first.');
  process.exit(1);
}

const failures = [];

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  // Only inspect main prose — skip head/nav noise by focusing on <main>
  const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? html;
  for (const re of PROBES) {
    if (re.test(main)) failures.push(`${file}: matched ${re}`);
  }
  const hits = main.match(ADJACENT);
  if (hits) {
    for (const h of hits) {
      // Allow stamp / board figures that sit against punctuation-free UI chrome only when
      // they are not letter-adjacent in prose — ADJACENT already requires a letter.
      failures.push(`${file}: ${h}`);
    }
  }
}

if (failures.length) {
  console.error('Whitespace regression (FIX 2):');
  for (const f of [...new Set(failures)].slice(0, 80)) console.error(`  ${f}`);
  if (failures.length > 80) console.error(`  …and ${failures.length - 80} more`);
  process.exit(1);
}

console.log(`Whitespace OK: ${pages.length} pages`);
