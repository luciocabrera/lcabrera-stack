#!/usr/bin/env node
/**
 * Gate: every count in a research write-up is re-derivable by its reader.
 *
 * Why this exists: `docs/agents/research/` holds dated records of what *other*
 * projects do, and nothing in this repository can check a claim about someone
 * else's tree. The one thing that can be checked is whether the author left a
 * way to check it. The reasoning, and what counts as an answer, are in
 * `scripts/lib/research-claims.mjs`; the authoring rules are in
 * `docs/agents/research/README.md`.
 *
 * Usage: node scripts/verify-research-claims.mjs
 * Exit : 0 clean, 1 when a count has neither a command nor an enumeration.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describeClaim, unprobedClaims } from './lib/research-claims.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RESEARCH_DIR = join(REPO_ROOT, 'docs/agents/research');

/** The home's own README states the rules; it is not itself a research record. */
const NOT_A_RECORD = new Set(['README.md']);

/** (pure enough — one readdir, no state) */
const researchDocs = (dir) =>
  readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .filter((entry) => !NOT_A_RECORD.has(entry.name))
    .map((entry) => join(dir, entry.name));

const report = (findings) => {
  if (findings.length === 0) {
    return 'Research-claims gate passed: every count names a command or lists what it counts.';
  }
  return [
    `Research-claims gate — ${findings.length} count(s) a reader cannot re-derive:`,
    '',
    ...findings.map(describeClaim),
    '',
    'Name the command that produces the number in the same paragraph',
    '(`ls …`, `find … | wc -l`, `jq … | length`), or enumerate what you counted.',
    'A count nobody can re-run is the claim most likely to be wrong and the',
    'least likely to be checked — see docs/agents/research/README.md.',
  ].join('\n');
};

const main = () => {
  const findings = researchDocs(RESEARCH_DIR).flatMap((path) =>
    unprobedClaims(relative(REPO_ROOT, path), readFileSync(path, 'utf8')),
  );
  console.log(report(findings));
  process.exitCode = findings.length === 0 ? 0 : 1;
};

try {
  main();
} catch (error) {
  console.error(`Research-claims gate could not run: ${error.message}`);
  process.exitCode = 1;
}
