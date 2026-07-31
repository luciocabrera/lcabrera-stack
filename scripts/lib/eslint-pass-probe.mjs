/**
 * Pure rules for the eslint-pass gate. Effects live in
 * `../verify-eslint-pass.mjs`.
 */

/** The rule whose silence this gate exists to catch. */
export const PROBE_RULE = 'perfectionist/sort-imports';

/**
 * One workspace per shared eslint config. `packages/ui` resolves
 * `eslint-custom-rules` (React + StyleX) and `packages/plugins` resolves
 * `eslint-base-custom-rules`; they are separate code paths and #472 broke both.
 */
export const PROBE_WORKSPACES = ['packages/ui', 'packages/plugins'];

/**
 * Imports deliberately out of order — `node:process` sorts after `node:path`.
 *
 * Any import drives perfectionist's internal/external classification, which is
 * the code path that reaches for the TypeScript compiler API and the one that
 * threw in #472. Confirmed to report `PROBE_RULE` before this gate was written;
 * a plant that does not fire makes a broken pass look like a passing one.
 */
export const probeSource = () =>
  [
    "import process from 'node:process';",
    "import { join } from 'node:path';",
    '',
    "export const probe = join(process.cwd(), 'probe');",
    '',
  ].join('\n');

/**
 * Classify one probe run as `crashed`, `silent` or `reported`.
 *
 * eslint exits non-zero both when it reports findings and when a rule throws,
 * so the exit code cannot tell those apart — but a throwing rule prints no
 * parseable JSON, which can. `silent` means the pass ran and the rule did not
 * report the planted violation, i.e. it is not loaded.
 */
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
