import { describe, expect, it } from 'vite-plus/test';

import { CASES_DIR, openCase } from './adjudicate-command.mjs';

const BUILDER_NOTES =
  'BUILDER-NOTE: I am sure this is fine because the table name is trusted';

const FILE = 'packages/x/src/query.util.ts';

const SOURCE = [
  'import { trusted } from "./trusted.util.ts";',
  '',
  'export const query = (table) => "select * from " + table;',
  '',
].join('\n');

const readNotes = [];

const REGISTRY = {
  issue_types: [
    {
      aliases: ['complexity-both'],
      command: 'health',
      id: 'high-complexity',
      suppress_comment: '// fallow-ignore-next-line complexity',
    },
    {
      command: 'dupes',
      id: 'code-duplication',
      suppress_comment: '// fallow-ignore-next-line code-duplication',
    },
    { command: 'dead-code', id: 'unused-file', result_key: 'unused_files' },
    {
      command: 'dead-code',
      id: 'unused-export',
      result_key: 'unused_exports',
      suppress_comment: '// fallow-ignore-next-line unused-export',
    },
    { command: 'security', id: 'sql-injection' },
    { command: 'health', id: 'css-dead-surface' },
  ],
};

const ESLINT_REPORT = [
  {
    filePath: `/repo/${FILE}`,
    messages: [{ line: 3, message: 'concat', ruleId: 'no-sql-concat' }],
  },
];

const fakeEffects = ({
  calls = [],
  out = [],
  report = ESLINT_REPORT,
  stdout,
  written = [],
} = {}) => ({
  caseNames: () => ['FP-0003.json', 'FP-0007', 'README.md'],
  fallowRegistry: () => REGISTRY,
  now: () => '2026-10-30T10:00:00.000Z',
  readJson: (path) => {
    calls.push({ readJson: path });
    return report;
  },
  readText: () => SOURCE,
  isRepoFile: (file) => file === FILE,
  run: ({ args, cwd, tool }) => {
    calls.push({ args, cwd, tool });
    if (args.includes('explain')) return { status: 0, stdout: 'Rule docs.' };
    if (args.some((arg) => arg.startsWith('--trace='))) {
      return { status: 0, stdout: 'Trace.' };
    }
    return { status: 1, stdout: stdout ?? `noise\n${JSON.stringify(report)}` };
  },
  shas: () => ({ base: '1'.repeat(40), head: '2'.repeat(40) }),
  workspaceOf: () => 'packages/x',
  write: (text) => out.push(text),
  writeJson: (path, value) => written.push({ path, value }),
  ...Object.fromEntries(
    ['commitMessage', 'prBody', 'taskFile', 'transcript'].map((source) => [
      source,
      () => {
        readNotes.push(source);
        return BUILDER_NOTES;
      },
    ]),
  ),
});

const open = ({ argv, ...options }) => {
  const calls = [];
  const out = [];
  const written = [];
  const status = openCase({
    argv,
    effects: fakeEffects({ calls, out, written, ...options }),
  });
  return { calls, out, status, value: written[0]?.value };
};

describe('openCase — the analyzer it runs', () => {
  it("runs the workspace's ESLint on the path inside it, and reports the case it wrote", () => {
    const { calls, out, status } = open({
      argv: ['--', 'eslint', `${FILE}:3:no-sql-concat`],
    });
    expect(status).toBe(0);
    expect(calls).toEqual([
      {
        args: ['--format', 'json', '--', 'src/query.util.ts'],
        cwd: 'packages/x',
        tool: 'eslint',
      },
    ]);
    expect(out).toEqual([
      'Opened FP-0008: docs/agents/adjudications/FP-0008/case.json\nRun the panel next: vp run adjudicate:panel -- FP-0008 --builder-model <your model id>\n',
    ]);
  });

  it('runs Oxlint through vp lint', () => {
    const diagnostic = {
      code: 'eslint(no-console)',
      filename: FILE,
      labels: [{ span: { line: 3 } }],
    };
    const { calls, value } = open({
      argv: ['oxlint', `${FILE}:3:no-console`],
      report: { diagnostics: [diagnostic] },
    });
    expect(calls).toEqual([
      {
        args: ['lint', '--format', 'json', '--', FILE],
        cwd: undefined,
        tool: 'vp',
      },
    ]);
    expect(value.finding).toEqual([diagnostic]);
    expect(value.explain).toBeNull();
  });

  it("runs Biome's linter and its explanation of the rule", () => {
    const diagnostic = {
      category: 'lint/suspicious/noDebugger',
      location: { path: FILE, start: { line: 3 } },
    };
    const { calls, value } = open({
      argv: ['biome', `${FILE}:3:lint/suspicious/noDebugger`],
      report: { diagnostics: [diagnostic] },
    });
    expect(calls).toEqual([
      {
        args: ['lint', '--reporter=json', '--', FILE],
        cwd: undefined,
        tool: 'biome',
      },
      { args: ['explain', 'noDebugger'], cwd: undefined, tool: 'biome' },
    ]);
    expect(value.explain).toBe('Rule docs.');
    expect(value.trace).toBeNull();
  });

  it("reads React Doctor's last report instead of running it", () => {
    const diagnostic = { file: FILE, line: 3, rule: 'react-doctor/x' };
    const { calls, value } = open({
      argv: ['react-doctor', `${FILE}:3:react-doctor/x`],
      report: { diagnostics: [diagnostic] },
    });
    expect(calls).toEqual([
      { readJson: 'reports/react-doctor/full-latest.json' },
    ]);
    expect(value.finding).toEqual([diagnostic]);
  });

  it('runs the fallow command the registry names, explains the rule, and traces nothing it cannot', () => {
    const { calls, value } = open({
      argv: ['fallow', `${FILE}:3:complexity-both`],
      report: { findings: [{ exceeded: 'both', line: 3, path: FILE }] },
    });
    expect(calls).toEqual([
      {
        args: ['health', '--format', 'json', '--quiet'],
        cwd: undefined,
        tool: 'fallow',
      },
      {
        args: ['explain', 'complexity-both'],
        cwd: undefined,
        tool: 'fallow',
      },
    ]);
    expect(value.case.rule).toBe('complexity');
    expect(value.trace).toBeNull();
  });

  it('traces a clone group by its own fingerprint', () => {
    const group = {
      fingerprint: 'dup:1',
      instances: [{ end_line: 3, file: FILE, start_line: 3 }],
    };
    const { calls, value } = open({
      argv: ['fallow', `${FILE}:3:code-duplication`],
      report: { clone_groups: [group] },
    });
    expect(calls.at(-1)).toEqual({
      args: ['dupes', '--trace=dup:1', '--format', 'json', '--quiet'],
      cwd: undefined,
      tool: 'fallow',
    });
    expect(value.finding).toEqual([group]);
    expect(value.trace).toBe('Trace.');
  });

  it('traces the target it is given in place of a fingerprint', () => {
    const { calls } = open({
      argv: ['fallow', `${FILE}:3:unused-file`, '--trace', `${FILE}:query`],
      report: { unused_files: [{ line: 3, path: FILE }] },
    });
    expect(calls[0].args[0]).toBe('dead-code');
    expect(calls.at(-1).args).toContain(`--trace=${FILE}:query`);
  });

  it('records no trace for a dead-code finding with no target', () => {
    const { calls, value } = open({
      argv: ['fallow', `${FILE}:3:unused-file`],
      report: { unused_files: [{ line: 3, path: FILE }] },
    });
    expect(calls).toHaveLength(2);
    expect(value.case.rule).toBe('unused-file');
    expect(value.trace).toBeNull();
  });

  it('does not open an unused-file case on an unused-export record', () => {
    expect(() =>
      open({
        argv: ['fallow', `${FILE}:3:unused-file`],
        report: { unused_exports: [{ line: 3, path: FILE }] },
      }),
    ).toThrow('fallow does not report unused-file');
  });

  it.each(['unknown-rule', 'css-dead-surface'])(
    'refuses %s, for which the registry gives no report section',
    (rule) => {
      expect(() =>
        open({ argv: ['fallow', `${FILE}:3:${rule}`], report: {} }),
      ).toThrow(
        `fallow's issue registry gives no report section for "${rule}"`,
      );
    },
  );

  it('reads --trace and --pr after the -- that vp run forwards', () => {
    const { calls, value } = open({
      argv: [
        '--',
        'fallow',
        `${FILE}:3:unused-file`,
        '--trace',
        `${FILE}:query`,
        '--pr',
        '7',
      ],
      report: { unused_files: [{ line: 3, path: FILE }] },
    });
    expect(calls.at(-1).args).toContain(`--trace=${FILE}:query`);
    expect(value.case.pr).toBe(7);
  });

  it.each([['--flag'], ['a b'], ['$(x)']])(
    'refuses the trace target %j',
    (target) => {
      expect(() =>
        open({
          argv: ['fallow', `${FILE}:3:unused-file`, `--trace=${target}`],
          report: { unused_files: [{ line: 3, path: FILE }] },
        }),
      ).toThrow('--trace takes a fallow trace target');
    },
  );

  it.each([
    [
      ['eslint', 'packages/x/src/other.ts:3:no-sql-concat'],
      {},
      'packages/x/src/other.ts is not a file inside this repository',
    ],
    [
      ['eslint', `${FILE}:3:no-sql-concat`],
      { stdout: 'oops' },
      'the analyzer printed no JSON report',
    ],
    [['eslint', `${FILE}:3:no-sql-concat`, BUILDER_NOTES], {}, 'usage'],
    [['eslint', `${FILE}:1:no-sql-concat`], {}, 'nothing to adjudicate'],
  ])('refuses %j', (argv, options, message) => {
    expect(() => open({ argv, ...options })).toThrow(message);
  });

  it('records the pull request it is given', () => {
    expect(
      open({ argv: ['eslint', `${FILE}:3:no-sql-concat`, '--pr', '12'] }).value
        .case.pr,
    ).toBe(12);
  });

  it.each([['0'], ['-3'], ['1.5'], ['abc']])('refuses --pr %s', (pr) => {
    expect(() =>
      open({ argv: ['eslint', `${FILE}:3:no-sql-concat`, `--pr=${pr}`] }),
    ).toThrow(`--pr must be a pull request number; got "${pr}"`);
  });
});

describe('openCase — what reaches the panel', () => {
  it("writes the finding, the code and the shas, and none of the builder's notes", () => {
    const written = [];
    openCase({
      argv: ['eslint', `${FILE}:3:no-sql-concat`],
      effects: fakeEffects({ written }),
    });
    const [{ path, value }] = written;
    const text = JSON.stringify(value);
    expect(path).toBe(`${CASES_DIR}/FP-0008/case.json`);
    expect(CASES_DIR).toBe('docs/agents/adjudications');
    expect(value.case).toMatchObject({
      analyzer: 'eslint',
      case_id: 'FP-0008',
      file: FILE,
      rule: 'no-sql-concat',
    });
    expect(value.finding).toEqual([
      { line: 3, message: 'concat', ruleId: 'no-sql-concat' },
    ]);
    expect(value.code.context).toContain('select * from');
    expect(text).not.toContain('BUILDER-NOTE');
    expect(readNotes).toEqual([]);
    expect(Object.keys(value).toSorted()).toEqual([
      'case',
      'code',
      'explain',
      'finding',
      'schema_version',
      'trace',
    ]);
  });

  it.each([['--notes'], ['--reason'], ['--description']])(
    'refuses %s, so there is no way to hand the panel an argument',
    (flag) => {
      expect(() =>
        openCase({
          argv: ['eslint', `${FILE}:3:no-sql-concat`, flag, BUILDER_NOTES],
          effects: fakeEffects(),
        }),
      ).toThrow(/Unknown option/u);
    },
  );

  it("names a fallow case by the marker token the analyzer's registry gives", () => {
    const written = [];
    openCase({
      argv: ['fallow', `${FILE}:3:high-complexity`],
      effects: fakeEffects({
        report: { findings: [{ exceeded: 'both', line: 3, path: FILE }] },
        written,
      }),
    });
    expect(written[0].value.case.rule).toBe('complexity');
    expect(written[0].value.explain).toBe('Rule docs.');
  });

  it('refuses an analyzer outside the panel', () => {
    expect(() =>
      openCase({ argv: ['sonar', `${FILE}:3:x`], effects: fakeEffects() }),
    ).toThrow('analyzers: biome, eslint, fallow, oxlint, react-doctor');
  });
});
