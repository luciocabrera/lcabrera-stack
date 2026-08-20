import { describe, expect, test } from 'vite-plus/test';

import { analyseClosure } from './closure.mjs';

describe('analyseClosure and declared config requirements', () => {
  const rootDirectory = 'skills/epic';

  const declaring = (...keys) => [
    {
      content: [
        '---',
        'name: epic',
        `requires: [${keys.join(', ')}]`,
        '---',
        '',
        '# Epic',
      ].join('\n'),
      path: 'skills/epic/SKILL.md',
    },
  ];

  test('a key outside the config key space is an escape of its own kind', () => {
    const { escapes } = analyseClosure({
      allowedConfigKeys: ['profile', 'paths.skills'],
      files: declaring('config.paths.dashboards'),
      rootDirectory,
    });
    expect(escapes).toEqual([
      {
        file: 'skills/epic/SKILL.md',
        kind: 'requires',
        line: 3,
        reference: 'config.paths.dashboards',
      },
    ]);
  });

  test('a key the config space carries is not an escape', () => {
    expect(
      analyseClosure({
        allowedConfigKeys: ['profile', 'commands.install'],
        files: declaring('config.commands.install'),
        rootDirectory,
      }).escapes,
    ).toEqual([]);
  });

  test('a requires: that is not about config raises nothing', () => {
    // The declaration a shipped reference file already carries. It must stay
    // invisible to this pass or `--shipped` reports an escape that is not one.
    expect(
      analyseClosure({
        allowedConfigKeys: [],
        files: declaring('react-router@7.9.0+', 'v8_middleware: true'),
        rootDirectory,
      }).escapes,
    ).toEqual([]);
  });

  test('reports a link, a command, an import and a requires as four kinds', () => {
    const files = [
      {
        content: [
          '---',
          'requires: [config.paths.dashboards]',
          '---',
          '',
          'Read [the contract](../../docs/agents/contract.md).',
          '',
          '```bash',
          'vp run test',
          '```',
        ].join('\n'),
        path: 'skills/epic/SKILL.md',
      },
      {
        content: "import { scan } from '@repo/scan-report/deterministic-scan';",
        path: 'skills/epic/scripts/run.mjs',
      },
    ];

    const { escapes } = analyseClosure({ files, rootDirectory });
    expect(
      escapes
        .map((finding) => finding.kind)
        .sort((left, right) => left.localeCompare(right)),
    ).toEqual(['command', 'import', 'link', 'requires']);
  });
});
