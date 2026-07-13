/**
 * FIX 8 — when src/data/*.json (except changelog.json) changes in HEAD,
 * require a same-day entry in src/data/changelog.json.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function git(cmd) {
  return execSync(gitCmd(cmd), { encoding: 'utf8' }).trim();
}

function gitCmd(cmd) {
  return `git ${cmd}`;
}

let files = [];
try {
  // Empty if HEAD has no parent (shallow/orphan) — treat as pass.
  git('rev-parse --verify HEAD~1');
  files = git('diff-tree --no-commit-id --name-only -r HEAD')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
} catch {
  console.log('Changelog-on-data-change: skipped (no HEAD~1)');
  process.exit(0);
}

const dataChanged = files.some(
  (f) => f.startsWith('src/data/') && f.endsWith('.json') && !f.endsWith('changelog.json'),
);

if (!dataChanged) {
  console.log('Changelog-on-data-change: OK (no data files in HEAD)');
  process.exit(0);
}

const commitDate = git('show -s --format=%cs HEAD'); // YYYY-MM-DD
const changelog = JSON.parse(readFileSync(join(process.cwd(), 'src/data/changelog.json'), 'utf8'));
const hasEntry = (changelog.entries ?? []).some((e) => e.date === commitDate);

if (!hasEntry) {
  console.error(
    `Changelog-on-data-change: HEAD changes data files but changelog.json has no entries[] date ${commitDate}.`,
  );
  console.error('Changed:', files.filter((f) => f.startsWith('src/data/')).join(', '));
  process.exit(1);
}

console.log(`Changelog-on-data-change: OK (entry for ${commitDate})`);
