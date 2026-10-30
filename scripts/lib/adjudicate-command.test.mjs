import { describe, expect, it } from 'vite-plus/test';

import { openCase } from './adjudicate-command.mjs';
import {
  matchingRecords,
  nextCaseId,
  parseFindingId,
} from './adjudication-case.mjs';

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

const fakeEffects = ({ report, written = [] } = {}) => ({
  caseNames: () => ['FP-0003.json', 'FP-0007', 'README.md'],
  fallowRegistry: () => ({
    issue_types: [
      {
        aliases: [],
        command: 'health',
        id: 'high-complexity',
        suppress_comment: '// fallow-ignore-next-line complexity',
      },
    ],
  }),
  now: () => '2026-10-30T10:00:00.000Z',
  readJson: () => report,
  readText: () => SOURCE,
  run: ({ args }) => {
    if (args.includes('explain')) return { status: 0, stdout: 'Rule docs.' };
    return {
      status: 1,
      stdout: JSON.stringify(
        report ?? [
          {
            filePath: `/repo/${FILE}`,
            messages: [{ line: 3, message: 'concat', ruleId: 'no-sql-concat' }],
          },
        ],
      ),
    };
  },
  shas: () => ({ base: '1'.repeat(40), head: '2'.repeat(40) }),
  workspaceOf: () => 'packages/x',
  write: () => undefined,
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

describe('openCase — what reaches the panel', () => {
  it("writes the finding, the code and the shas, and none of the builder's notes", () => {
    const written = [];
    openCase({
      argv: ['eslint', `${FILE}:3:no-sql-concat`],
      effects: fakeEffects({ written }),
    });
    const [{ path, value }] = written;
    const text = JSON.stringify(value);
    expect(path).toBe('docs/agents/adjudications/FP-0008/case.json');
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

  it('refuses a trailing free-text positional', () => {
    expect(() =>
      openCase({
        argv: ['eslint', `${FILE}:3:no-sql-concat`, BUILDER_NOTES],
        effects: fakeEffects(),
      }),
    ).toThrow(/usage/u);
  });

  it('refuses a finding the analyzer does not report now', () => {
    expect(() =>
      openCase({
        argv: ['eslint', `${FILE}:1:no-sql-concat`],
        effects: fakeEffects(),
      }),
    ).toThrow(/nothing to adjudicate/u);
  });

  it("names a fallow case by the marker token the analyzer's registry gives", () => {
    const written = [];
    openCase({
      argv: ['fallow', `${FILE}:3:high-complexity`],
      effects: fakeEffects({
        report: { findings: [{ line: 3, path: FILE, value: 30 }] },
        written,
      }),
    });
    expect(written[0].value.case.rule).toBe('complexity');
    expect(written[0].value.explain).toBe('Rule docs.');
  });

  it('refuses an analyzer outside the panel', () => {
    expect(() =>
      openCase({ argv: ['sonar', `${FILE}:3:x`], effects: fakeEffects() }),
    ).toThrow(/analyzers/u);
  });

  it('refuses a pull request that is not a number', () => {
    expect(() =>
      openCase({
        argv: ['eslint', `${FILE}:3:no-sql-concat`, '--pr', 'abc'],
        effects: fakeEffects(),
      }),
    ).toThrow(/--pr/u);
  });
});

describe('parseFindingId', () => {
  it('reads a file, a line range and a rule that itself holds a colon', () => {
    expect(
      parseFindingId('packages/a.ts:4-9:policy-violation:pack/rule'),
    ).toEqual({
      end: 9,
      file: 'packages/a.ts',
      rule: 'policy-violation:pack/rule',
      start: 4,
    });
  });

  it.each(['packages/a.ts', 'packages/a.ts:9-4:x', 'packages/a.ts:0:x'])(
    'refuses "%s"',
    (id) => {
      expect(() => parseFindingId(id)).toThrow(/finding id/u);
    },
  );
});

describe('nextCaseId', () => {
  it('takes the next number after every case file and directory', () => {
    expect(nextCaseId(['FP-0009.json', 'FP-0012', 'notes.md'])).toBe('FP-0013');
    expect(nextCaseId([])).toBe('FP-0001');
  });
});

describe('matchingRecords', () => {
  const finding = {
    end: 2,
    file: 'a.ts',
    ruleNeedle: 'lint/suspicious/noDebugger',
    start: 2,
    whole: false,
  };

  it('finds a Biome diagnostic by its location', () => {
    const diagnostic = {
      category: 'lint/suspicious/noDebugger',
      location: { path: 'a.ts', start: { line: 2 } },
    };
    expect(
      matchingRecords({
        finding,
        report: {
          diagnostics: [
            diagnostic,
            { ...diagnostic, location: { path: 'a.ts', start: { line: 7 } } },
          ],
        },
      }),
    ).toEqual([diagnostic]);
  });

  it('returns the whole record when asked, as a clone group is', () => {
    const group = {
      fingerprint: 'dup:1',
      instances: [{ end_line: 3, file: 'a.ts', start_line: 2 }],
    };
    expect(
      matchingRecords({
        finding: { ...finding, ruleNeedle: '', whole: true },
        report: { clone_groups: [group] },
      }),
    ).toEqual([group]);
  });
});
