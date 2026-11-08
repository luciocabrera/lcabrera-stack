import { describe, expect, it } from 'vite-plus/test';

import { recordRuling } from './adjudicate-rule.mjs';
import { listEntryFor } from './adjudication-panel.mjs';
import {
  CASE,
  check,
  envelope,
  verifier,
} from './false-positives-fixtures.mjs';

const RECORD = `docs/agents/adjudications/${CASE}.json`;
const CASE_FILE = `docs/agents/adjudications/${CASE}/case.json`;
const LIST = 'docs/agents/false-positives.json';
const URL = 'https://github.com/luciocabrera/lcabrera-stack/pull/1595#c1';

const SPLIT = envelope({
  outcome: 'split',
  verifiers: [
    verifier('claude-opus-5-5', 'judge'),
    verifier('claude-sonnet-5', 'judge', 'REAL'),
    verifier('claude-fable-1', 'adversary'),
  ],
});

const CASE_BODY = { case: SPLIT.case, code: { end: 2, start: 2 } };

const rule = ({ argv, files = {}, today = '2026-11-08' }) => {
  const store = { [CASE_FILE]: CASE_BODY, [RECORD]: SPLIT, ...files };
  const written = {};
  const out = [];
  const run = () =>
    recordRuling({
      argv,
      effects: {
        listPath: LIST,
        readJson: (path) => store[path],
        readList: () => store[LIST],
        today: () => today,
        write: (text) => out.push(text),
        writeJson: (path, value) => {
          written[path] = value;
        },
      },
    });
  return { out, run, written };
};

const ARGS = ['--', CASE, '--by', 'luciocabrera', '--reference', URL];

describe('recordRuling — a FALSE_POSITIVE ruling', () => {
  it('writes the ruling, the list entry and the marker, and the gate then passes', () => {
    const { out, run, written } = rule({
      argv: [...ARGS, '--verdict', 'FALSE_POSITIVE'],
    });
    expect(run()).toBe(0);
    expect(written[RECORD]).toEqual({
      ...SPLIT,
      owner_ruling: {
        at: '2026-11-08',
        by: 'luciocabrera',
        reference: URL,
        verdict: 'FALSE_POSITIVE',
      },
    });
    const entry = listEntryFor({ caseFile: CASE_BODY, evidence: RECORD });
    expect(written[LIST]).toEqual([{ ...entry, expires: '2027-05-08' }]);
    expect(written[RECORD].verifiers[0].evidence).toBe(
      'Ran the trace and found no path from input to the identifier.',
    );
    expect(out.join('')).toContain(
      `// fallow-ignore-next-line security/sql-concat -- false positive, case ${CASE}: <one-line reason>`,
    );
    expect(
      check({
        cases: { [RECORD]: written[RECORD] },
        entries: written[LIST],
        today: '2026-11-08',
      }),
    ).toEqual([]);
  });

  it('counts six months from a late ruling, so its entry is live and the gate passes', () => {
    const { run, written } = rule({
      argv: [...ARGS, '--verdict', 'FALSE_POSITIVE'],
      today: '2027-06-01',
    });
    expect(run()).toBe(0);
    expect(written[LIST][0].expires).toBe('2027-12-01');
    expect(
      check({
        cases: { [RECORD]: written[RECORD] },
        entries: written[LIST],
        today: '2027-06-01',
      }),
    ).toEqual([]);
  });

  it('refuses a ruling dated so long ago that its entry has already expired', () => {
    const { run, written } = rule({
      argv: [...ARGS, '--verdict', 'FALSE_POSITIVE', '--at', '2026-11-08'],
      today: '2027-05-09',
    });
    expect(run).toThrow(
      "a ruling dated 2026-11-08 gives a list entry that expired on 2027-05-08, six months later; rule again with today's date",
    );
    expect(written).toEqual({});
  });

  it('accepts a ruling dated today and refuses one dated tomorrow, writing nothing', () => {
    expect(
      rule({
        argv: [...ARGS, '--verdict', 'REAL', '--at', '2026-11-08'],
      }).run(),
    ).toBe(0);
    const { run, written } = rule({
      argv: [...ARGS, '--verdict', 'FALSE_POSITIVE', '--at', '2026-11-09'],
    });
    expect(run).toThrow(
      "a ruling cannot be dated 2026-11-09, after today (2026-11-08); its entry's six months would start late",
    );
    expect(written).toEqual({});
  });

  it('accepts a ruling whose entry expires on the day it is recorded', () => {
    const { run } = rule({
      argv: [...ARGS, '--verdict', 'FALSE_POSITIVE', '--at', '2026-11-08'],
      today: '2027-05-08',
    });
    expect(run()).toBe(0);
  });

  it('appends to a list that already holds other cases, and takes --at', () => {
    const other = { case: 'FP-0001' };
    const { run, written } = rule({
      argv: [...ARGS, '--verdict', 'FALSE_POSITIVE', '--at', '2026-11-07'],
      files: { [LIST]: [other] },
    });
    run();
    expect(written[LIST].map(({ case: id }) => id)).toEqual(['FP-0001', CASE]);
    expect(written[RECORD].owner_ruling.at).toBe('2026-11-07');
  });

  it('refuses a case the list already holds, and writes nothing', () => {
    const { run, written } = rule({
      argv: [...ARGS, '--verdict', 'FALSE_POSITIVE'],
      files: { [LIST]: [{ case: CASE }] },
    });
    expect(run).toThrow(`${LIST} already holds ${CASE}`);
    expect(written).toEqual({});
  });
});

describe('recordRuling — a REAL ruling', () => {
  it('writes the ruling alone: no list entry, no marker', () => {
    const { out, run, written } = rule({
      argv: [...ARGS, '--verdict', 'REAL'],
    });
    expect(run()).toBe(0);
    expect(Object.keys(written)).toEqual([RECORD]);
    expect(written[RECORD].owner_ruling.verdict).toBe('REAL');
    expect(out.join('')).toContain('Fix the finding; there is no marker');
  });
});

describe('recordRuling — what it refuses', () => {
  it.each([
    { argv: ['--', CASE, '--verdict', 'REAL', '--reference', URL], why: 'by' },
    {
      argv: ['--', CASE, '--verdict', 'REAL', '--by', 'luciocabrera'],
      why: 'reference',
    },
    { argv: [...ARGS], why: 'verdict' },
    { argv: [...ARGS, '--verdict', 'MAYBE'], why: 'verdict' },
    { argv: [...ARGS, '--verdict', 'REAL', '--at', '30/10/2026'], why: 'at' },
    {
      argv: [
        '--',
        CASE,
        '--verdict',
        'REAL',
        '--by',
        'a b',
        '--reference',
        URL,
      ],
      why: 'by',
    },
    {
      argv: [
        '--',
        CASE,
        '--verdict',
        'REAL',
        '--by',
        'luciocabrera',
        '--reference',
        'the thread',
      ],
      why: 'reference',
    },
  ])('refuses a ruling with a missing or malformed $why', ({ argv, why }) => {
    const { run, written } = rule({ argv });
    expect(run).toThrow(`owner_ruling.${why}`);
    expect(written).toEqual({});
  });

  it('refuses free text, a second positional and a malformed case id', () => {
    expect(rule({ argv: [...ARGS, '--note', 'trust me'] }).run).toThrow(
      "Unknown option '--note'",
    );
    expect(rule({ argv: [...ARGS, 'extra'] }).run).toThrow('usage:');
    expect(rule({ argv: ['--', 'FP-1'] }).run).toThrow('is not a case id');
  });

  it('refuses a missing case id with the usage line', () => {
    expect(rule({ argv: ['--', '--verdict', 'REAL'] }).run).toThrow(
      'usage: vp run adjudicate:rule -- <FP-nnnn>',
    );
  });

  it('lists every field the schema refuses, one per line', () => {
    const { run } = rule({
      argv: [
        '--',
        CASE,
        '--verdict',
        'REAL',
        '--by',
        'a b',
        '--reference',
        'x',
      ],
    });
    expect(run).toThrow(
      /the ruling does not make a valid envelope:\n {2}owner_ruling\.by: [^\n]+\n {2}owner_ruling\.reference: /u,
    );
  });

  it('refuses a FALSE_POSITIVE ruling whose case file is gone, and writes nothing', () => {
    const { run, written } = rule({
      argv: [...ARGS, '--verdict', 'FALSE_POSITIVE'],
      files: { [CASE_FILE]: undefined },
    });
    expect(run).toThrow(`${CASE_FILE} does not exist`);
    expect(written).toEqual({});
  });

  it('refuses a case the panel has not ruled on', () => {
    const { run } = rule({
      argv: [...ARGS, '--verdict', 'REAL'],
      files: { [RECORD]: undefined },
    });
    expect(run).toThrow(`${CASE} has no panel record`);
  });

  it('refuses to overwrite a ruling', () => {
    const ruled = {
      ...SPLIT,
      owner_ruling: {
        at: '2026-11-08',
        by: 'luciocabrera',
        reference: URL,
        verdict: 'REAL',
      },
    };
    const { run } = rule({
      argv: [...ARGS, '--verdict', 'FALSE_POSITIVE'],
      files: { [RECORD]: ruled },
    });
    expect(run).toThrow('a ruling is never overwritten');
  });

  it('refuses a ruling on a unanimous dismissal, which needs none', () => {
    const { run } = rule({
      argv: [...ARGS, '--verdict', 'FALSE_POSITIVE'],
      files: { [RECORD]: envelope() },
    });
    expect(run).toThrow('an owner ruling closes a split or fixed case');
  });
});
