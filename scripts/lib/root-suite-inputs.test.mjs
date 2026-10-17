import { describe, expect, it } from 'vite-plus/test';

import { suiteInputs } from './root-suite-inputs.mjs';

const GRAPH = [
  { dir: 'packages/history', pkgName: '@scope/history' },
  { dir: 'packages/ui', pkgName: '@scope/ui' },
];

const inputsOf = (sources, extraTracked = []) =>
  suiteInputs({
    graph: GRAPH,
    readSource: (file) => sources[file] ?? '',
    suiteDir: 'suite',
    tracked: [...Object.keys(sources), ...extraTracked],
  });

describe('suiteInputs', () => {
  it('resolves a relative URL against the file that names it', () => {
    expect(
      inputsOf(
        {
          'suite/deep/a.test.mjs':
            "readFileSync(new URL('../../.agents/verifier.md', import.meta.url));",
        },
        ['.agents/verifier.md'],
      ),
    ).toEqual(['.agents/verifier.md']);
  });

  it('reads a repo-relative path constant and a REPO_ROOT join', () => {
    expect(
      inputsOf(
        {
          'suite/a.test.mjs': [
            "const README = 'docs/guide/README.md';",
            "readFileSync(join(REPO_ROOT, '.config', 'settings.json'));",
          ].join('\n'),
        },
        ['docs/guide/README.md', '.config/settings.json'],
      ),
    ).toEqual(['.config/settings.json', 'docs/guide/README.md']);
  });

  it('maps a workspace import to that workspace, and only that one', () => {
    expect(
      inputsOf(
        {
          'suite/a.mjs': "import { x } from '@scope/history/stats/x.util';",
        },
        ['packages/history/package.json', 'packages/ui/package.json'],
      ),
    ).toEqual(['packages/history/package.json']);
  });

  it('follows relative imports out of the suite and through the module they reach', () => {
    expect(
      inputsOf({
        'suite/a.mjs': "import { run } from '../tools/run.mjs';",
        'tools/run.mjs': "import { exec } from './exec.mjs';",
        'tools/exec.mjs': '',
      }),
    ).toEqual(['tools/exec.mjs', 'tools/run.mjs']);
  });

  it('scans a module reached outside the suite for the paths it reads', () => {
    expect(
      inputsOf(
        {
          'suite/a.mjs': "import { run } from '../tools/run.mjs';",
          'tools/run.mjs': [
            "const GUIDE = 'docs/guide/planning.md';",
            "readFileSync(join(REPO_ROOT, '.config', 'tool.json'));",
          ].join('\n'),
        },
        ['docs/guide/planning.md', '.config/tool.json'],
      ),
    ).toEqual(['.config/tool.json', 'docs/guide/planning.md', 'tools/run.mjs']);
  });

  it('ignores a path named only in a comment, and reads past a regex literal', () => {
    expect(
      inputsOf(
        {
          'suite/a.mjs': [
            '// see docs/guide/README.md',
            'const ROW = /^\\| `([^`]+)`/u;',
            "const GUIDE = 'docs/guide/planning.md';",
          ].join('\n'),
        },
        ['docs/guide/README.md', 'docs/guide/planning.md'],
      ),
    ).toEqual(['docs/guide/planning.md']);
  });

  it('reads an unterminated REPO_ROOT join of many segments without backtracking', () => {
    const source = `join(REPO_ROOT, ${"'a' ".repeat(28)}x`;
    expect(inputsOf({ 'suite/a.mjs': source }, ['a'])).toEqual([]);
  }, 1000);

  it('marks a directory it reads so a pattern for its contents is tested', () => {
    expect(
      inputsOf({ 'suite/a.mjs': "readdirSync('rules/agents');" }, [
        'rules/agents/one.md',
      ]),
    ).toEqual(['rules/agents/']);
  });

  it('drops untracked paths and paths inside the suite itself', () => {
    expect(
      inputsOf({
        'suite/a.mjs': [
          "import { b } from './b.mjs';",
          "readFileSync('node_modules/.bin/tool');",
          "readFileSync('suite/fixtures/one.json');",
        ].join('\n'),
        'suite/b.mjs': '',
      }),
    ).toEqual([]);
  });
});
