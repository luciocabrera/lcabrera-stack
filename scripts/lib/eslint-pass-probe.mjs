/**
 * Pure rules for the eslint-pass gate. Effects live in
 * `../verify-eslint-pass.mjs`.
 *
 * The probe workspaces are one per shared eslint config: `packages/ui` resolves
 * `eslint-custom-rules` (React + StyleX) and `packages/vite-configs` resolves
 * `eslint-base-custom-rules`. They are separate code paths and #472 broke both;
 * the base-config probe used to run in `packages/plugins`, which ADR-069 folded
 * into `packages/vite-configs`, so it now also covers the one workspace that
 * cannot reach the base factory through the `exports` map.
 *
 * The planted source has its imports deliberately out of order — `node:process`
 * sorts after `node:path` — because any import drives perfectionist's
 * internal/external classification, the code path that reaches for the
 * TypeScript compiler API and the one that threw in #472. It was confirmed to
 * report `PROBE_RULE` before this gate was written; a plant that does not fire
 * makes a broken pass look like a passing one.
 *
 * eslint exits non-zero both when it reports findings and when a rule throws,
 * so the exit code cannot tell those apart — but a throwing rule prints no
 * parseable JSON, which can. `silent` therefore means the pass ran and the rule
 * did not report the planted violation, i.e. it is not loaded.
 */

export const PROBE_RULE = 'perfectionist/sort-imports';

export const PROBE_WORKSPACES = ['packages/ui', 'packages/vite-configs'];

export const probeSource = () =>
  [
    "import process from 'node:process';",
    "import { join } from 'node:path';",
    '',
    "export const probe = join(process.cwd(), 'probe');",
    '',
  ].join('\n');

export const classifyProbe = (stdout) => {
  let report;

  try {
    report = JSON.parse(stdout);
  } catch {
    return 'crashed';
  }

  const reported = report
    .flatMap((file) => file.messages ?? [])
    .some((message) => message.ruleId === PROBE_RULE);

  return reported ? 'reported' : 'silent';
};
