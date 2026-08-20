import { describe, expect, test } from 'vite-plus/test';

import { describeEscape, renderClosureReport } from './closure-report.mjs';

describe('describeEscape', () => {
  test('gives each kind its own verb, so a reader knows what to fix', () => {
    const findings = [
      { file: 'a.md', kind: 'link', line: 4, resolved: 'docs/a.md' },
      { file: 'a.md', kind: 'command', line: 7, reference: 'vp' },
      { file: 'a.mjs', kind: 'import', line: 1, reference: 'ts-morph' },
      {
        file: 'a.md',
        kind: 'requires',
        line: 3,
        reference: 'config.paths.dashboards',
      },
    ];
    expect(findings.map(describeEscape)).toEqual([
      'a.md:4  needs docs/a.md',
      'a.md:7  runs vp',
      'a.mjs:1  imports ts-morph',
      'a.md:3  declares config.paths.dashboards',
    ]);
  });
});

describe('renderClosureReport', () => {
  test('marks a clean directory and lists what a dirty one escapes', () => {
    expect(
      renderClosureReport([
        { directory: 'skills/react-19', escapes: [], fileCount: 2 },
        {
          directory: 'skills/epic',
          escapes: [
            {
              file: 'skills/epic/SKILL.md',
              kind: 'requires',
              line: 3,
              reference: 'config.paths.dashboards',
            },
          ],
          fileCount: 1,
        },
      ]),
    ).toBe(
      [
        '✓ skills/react-19 — self-contained',
        '✗ skills/epic',
        '    skills/epic/SKILL.md:3  declares config.paths.dashboards',
      ].join('\n'),
    );
  });
});
