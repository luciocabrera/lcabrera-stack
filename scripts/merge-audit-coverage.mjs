// Merge every per-workspace `coverage/coverage-final.json` (istanbul JSON map)
// into a single file that `fallow audit --coverage` can consume for accurate
// per-function CRAP scores. Fallow accepts one coverage path, but vitest emits
// one map per workspace, so we combine them here.
//
// Keys in coverage-final.json are ABSOLUTE paths; we preserve them and let the
// audit strip the checkout prefix via `--coverage-root`. This keeps the merged
// file correct regardless of whether one or many workspaces contributed.
//
// Usage: node scripts/merge-audit-coverage.mjs
// Output: coverage/audit-coverage-final.json (gitignored)

import { globSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outFile = join(repoRoot, 'coverage', 'audit-coverage-final.json');

const coverageFiles = globSync('**/coverage/coverage-final.json', {
  cwd: repoRoot,
})
  .map((relative) => join(repoRoot, relative))
  .filter(
    (file) =>
      !file.includes('node_modules') && resolve(file) !== resolve(outFile),
  );

if (coverageFiles.length === 0) {
  console.error(
    'merge-audit-coverage: no coverage-final.json found. Run a workspace `test:coverage` first.',
  );
  process.exit(1);
}

const merged = coverageFiles.reduce(
  (acc, file) => Object.assign(acc, JSON.parse(readFileSync(file, 'utf8'))),
  {},
);

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(merged));

console.log(
  `merge-audit-coverage: merged ${coverageFiles.length} file(s), ${Object.keys(merged).length} covered file(s) -> ${outFile}`,
);
for (const file of coverageFiles)
  console.log(`  + ${file.replace(`${repoRoot}/`, '')}`);
