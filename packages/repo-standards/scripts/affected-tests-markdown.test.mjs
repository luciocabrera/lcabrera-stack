import { describe, expect, it } from 'vite-plus/test';

import { renderSelectionMarkdown } from './affected-tests.mjs';

const DISPOSITIONS = [
  {
    dir: 'packages/one',
    pkgName: '@scope/one',
    reason: 'changed',
    running: true,
    task: 'test',
  },
  {
    dir: 'packages/two',
    pkgName: '@scope/two',
    reason: 'depends on @scope/one',
    running: true,
    task: 'test:ci',
  },
  {
    dir: 'packages/three',
    pkgName: '@scope/three',
    reason: 'no changes detected',
    running: false,
    task: undefined,
  },
];

describe('renderSelectionMarkdown', () => {
  it('lists the running workspaces with their task and the skipped ones by name', () => {
    const markdown = renderSelectionMarkdown('partial', DISPOSITIONS);
    expect(markdown).toContain('## 🧪 Test Selection');
    expect(markdown).toContain('**2 of 3 workspaces** affected');
    expect(markdown).toContain('| `packages/one` | `test` | changed |');
    expect(markdown).toContain(
      '| `packages/two` | `test:ci` | depends on @scope/one |',
    );
    expect(markdown).toContain('### ⏭ Skipped — no changes detected');
    expect(markdown).toContain('`packages/three`');
    expect(markdown).not.toContain('test:scripts');
  });

  it('explains a full run and notes the root script suite when asked', () => {
    const markdown = renderSelectionMarkdown('full', DISPOSITIONS, {
      scripts: true,
      title: 'Selection',
    });
    expect(markdown).toContain('## Selection');
    expect(markdown).toContain('**Full run**');
    expect(markdown).toContain('all 3 workspaces run');
    expect(markdown).toContain('> Plus `test:scripts`');
  });

  it('omits an empty block rather than rendering a headed nothing', () => {
    const none = renderSelectionMarkdown(
      'none',
      DISPOSITIONS.map((d) => ({ ...d, running: false })),
    );
    expect(none).not.toContain('### ▶ Running');
    expect(none).toContain('**0 of 3 workspaces**');
    const all = renderSelectionMarkdown(
      'partial',
      DISPOSITIONS.map((d) => ({ ...d, running: true })),
    );
    expect(all).not.toContain('### ⏭ Skipped');
  });
});
