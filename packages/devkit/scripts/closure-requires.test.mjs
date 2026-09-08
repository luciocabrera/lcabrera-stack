import { describe, expect, test } from 'vite-plus/test';

import { analyseClosure } from './closure.mjs';
import { escapeKinds, escapingSkillFiles } from './test-fixtures.mjs';
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

describe('analyseClosure and declared config requirements', () => {
  const rootDirectory = 'skills/epic';
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
    expect(
      analyseClosure({
        allowedConfigKeys: [],
        files: declaring('react-router@7.9.0+', 'v8_middleware: true'),
        rootDirectory,
      }).escapes,
    ).toEqual([]);
  });

  test('reports a link, a command, an import and a requires as four kinds', () => {
    const { escapes } = analyseClosure({
      files: escapingSkillFiles(['requires: [config.paths.dashboards]']),
      rootDirectory,
    });
    expect(escapeKinds(escapes)).toEqual([
      'command',
      'import',
      'link',
      'requires',
    ]);
  });
});
