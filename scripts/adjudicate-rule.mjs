/**
 * Records the repository owner's ruling on a false-positive case the panel
 * could not settle: a split, or a fix that cannot be applied. A majority never
 * settles a split; only this named ruling does. Policy: ADR-147 and
 * docs/agents/public-package-suppressions.md.
 *
 * Usage: vp run adjudicate:rule -- <FP-nnnn> --verdict <FALSE_POSITIVE|REAL> --by <login> --reference <url> [--at <YYYY-MM-DD>]
 * Exit codes: 0 = ruling recorded; 1 = bad arguments, no panel record, a
 * ruling already recorded, or a ruling the envelope schema refuses.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import process from 'node:process';

import { readRegisters } from '../packages/repo-standards/scripts/config.mjs';
import { recordRuling } from './lib/adjudicate-rule.mjs';
import { repoPath } from './lib/tool-paths.mjs';

const ROOT = process.cwd();
const LIST = readRegisters(ROOT).falsePositives;

const inRepo = (path) => repoPath({ path, root: ROOT });

const readJson = (path) =>
  existsSync(inRepo(path))
    ? JSON.parse(readFileSync(inRepo(path), 'utf8'))
    : undefined;

const effects = {
  listPath: LIST,
  readJson,
  readList: () => readJson(LIST),
  today: () => new Date().toISOString().slice(0, 10),
  write: (text) => process.stdout.write(text),
  writeJson: (path, value) => {
    const target = inRepo(path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
  },
};

try {
  process.exitCode = recordRuling({ argv: process.argv.slice(2), effects });
} catch (error) {
  process.stderr.write(
    `adjudicate:rule: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
}
