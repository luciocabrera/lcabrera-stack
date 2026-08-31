/**
 * Pure rules for the eslint-pass gate. Effects live in
 * `../verify-eslint-pass.mjs`.
 */

/** The rule whose silence this gate exists to catch. */
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
