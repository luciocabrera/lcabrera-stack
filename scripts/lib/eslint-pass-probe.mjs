/**
 * Pure rules for the eslint-pass gate. Effects live in
 * `../verify-eslint-pass.mjs`.
 *
 * One probe per rule the gate must prove loaded. A rule reported by another
 * probe's file proves only that the pass ran: `perfectionist/sort-imports`
 * firing says the plugin graph resolved, and says nothing about whether a
 * custom rule is enabled. Each entry therefore plants a violation only its own
 * rule reports.
 */

export const PROBE_WORKSPACES = ['packages/ui', 'packages/vite-configs'];

export const PROBES = [
  {
    rule: 'perfectionist/sort-imports',
    silentHint:
      'a deliberately misordered import, so the rule is not loaded. Check the\n' +
      '  shared eslint configs in @lcabrera/vite-config.',
    source: () =>
      [
        "import process from 'node:process';",
        "import { join } from 'node:path';",
        '',
        "export const probe = join(process.cwd(), 'probe');",
        '',
      ].join('\n'),
  },
  {
    rule: 'local-rules/no-explanatory-comments',
    silentHint:
      'a comment planted above a declaration, so the custom-rules plugin is\n' +
      '  registered but this rule is off. Check both shared factories in\n' +
      '  @lcabrera/vite-config.',
    source: () =>
      [
        "import { join } from 'node:path';",
        '',
        '// A planted explanation the rule exists to report.',
        "export const probe = join('a', 'b');",
        '',
      ].join('\n'),
  },
];

export const classifyProbe = (stdout, rule) => {
  let report;

  try {
    report = JSON.parse(stdout);
  } catch {
    return 'crashed';
  }

  const reported = report
    .flatMap((file) => file.messages ?? [])
    .some((message) => message.ruleId === rule);

  return reported ? 'reported' : 'silent';
};
