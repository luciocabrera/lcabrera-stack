#!/usr/bin/env node
/**
 * Gate: the Vite+ managed block in AGENTS.md must render to nothing.
 *
 * Why this exists: Vite+ rewrites the region between its markers whenever it
 * syncs agent instructions, and `vp install` does that — so every fresh worktree,
 * and every CI run, silently got the upstream template back. That template's
 * Review Checklist instructs agents to run `vp test`, which AGENTS.md §4 forbids,
 * so the refill landed guidance contradicting the file around it. Nothing caught
 * it; the block's comment asked a human to notice and delete it again each time.
 *
 * The markers are now **removed** from AGENTS.md, which is what actually stops
 * the refill: Vite+'s `updateExistingAgentInstructions` documents "No Vite+
 * markers → no writes", and that was confirmed here by deleting them and running
 * both `vp install` and `vp config` without them returning. So the absent case is
 * the expected pass, and this gate exists to catch the region coming BACK — by an
 * explicit `vp` agent-setup run, or by hand — and being filled again.
 *
 * Usage: node scripts/verify-viteplus-block.mjs [--write]
 *        --write empties a refilled region in place, for a tree that still has
 *        the markers (a stale branch, or one that re-added them deliberately).
 * Exit  : 0 clean (or repaired), 1 when the region renders content or its
 *         markers are unpaired.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { errorMessage } from '../packages/repo-standards/scripts/error-message.mjs';
import {
  END_MARKER,
  findRegion,
  renderedLines,
  START_MARKER,
  withEmptiedRegion,
} from './lib/viteplus-block.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = join(REPO_ROOT, 'AGENTS.md');

/** The deliberate body: markers kept, nothing rendered, and the why recorded. */
const EMPTY_BODY = `

<!-- Deliberately empty, and gated by \`vp run viteplus:verify\`. Vite+ rewrites
     this region whenever it syncs agent instructions (\`vp install\` does), and the
     upstream template it writes tells agents to run \`vp test\`, which §4 forbids.
     Both markers must stay, and PAIRED — the END marker went missing once,
     leaving the region unterminated. To repair a refill: \`vp run viteplus:verify
     -- --write\`. -->

`;

const main = () => {
  const write = process.argv.includes('--write');
  const text = readFileSync(TARGET, 'utf8');
  const region = findRegion(text);

  if (region.kind === 'absent') {
    process.stdout.write(
      'Vite+ block gate passed: no managed markers, so the Vite+ sync is a no-op here.\n',
    );
    return;
  }

  if (region.kind === 'unpaired') {
    process.stderr.write(
      `AGENTS.md has an unpaired Vite+ marker — ${START_MARKER} and ${END_MARKER} must both be present, in that order.\n`,
    );
    process.exitCode = 1;
    return;
  }

  const offending = renderedLines(region.inner);
  if (offending.length === 0) {
    process.stdout.write(
      'Vite+ block gate passed: the managed region renders nothing.\n',
    );
    return;
  }

  if (write) {
    writeFileSync(TARGET, withEmptiedRegion(text, region, EMPTY_BODY));
    process.stdout.write(
      `Repaired AGENTS.md: emptied the Vite+ managed region (${offending.length} rendered line(s) removed).\n`,
    );
    return;
  }

  process.stderr.write(
    'The Vite+ managed region in AGENTS.md is not empty — a `vp` run refilled it with\n' +
      'upstream template content, which this repo does not review and which tells agents\n' +
      'to run `vp test` (forbidden by §4). Repair it with:\n\n' +
      '  vp run viteplus:verify -- --write\n\n' +
      `Rendered content (${offending.length} line(s)), first 5:\n`,
  );
  for (const line of offending.slice(0, 5)) {
    process.stderr.write(`  ${line.slice(0, 100)}\n`);
  }
  process.exitCode = 1;
};

try {
  main();
} catch (error) {
  process.stderr.write(`verify-viteplus-block: ${errorMessage(error)}\n`);
  process.exitCode = 1;
}
