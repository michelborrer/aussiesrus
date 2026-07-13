/**
 * FIX 1 — assert no horizontal page overflow at common mobile widths.
 * Requires a built `dist/` and playwright (devDependency).
 */
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const DIST = join(process.cwd(), 'dist');
const WIDTHS = [360, 390, 414, 768];
const HEIGHT = 800;

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
  console.error('No HTML files in dist/. Run `astro build` first.');
  process.exit(1);
}

const browser = await chromium.launch();
const failures = [];

try {
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: HEIGHT } });
    for (const file of pages) {
      const url = pathToFileURL(file).href;
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      if (scrollWidth > innerWidth + 1) {
        failures.push({
          file: relative(DIST, file),
          width,
          scrollWidth,
          innerWidth,
        });
      }
    }
    await page.close();
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error('Horizontal overflow detected:');
  for (const f of failures) {
    console.error(
      `  ${f.file} @ ${f.width}px: scrollWidth=${f.scrollWidth} > innerWidth=${f.innerWidth}`,
    );
  }
  process.exit(1);
}

console.log(`Responsive OK: ${pages.length} pages × ${WIDTHS.join('/')}px`);
