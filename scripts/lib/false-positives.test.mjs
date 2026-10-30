import { toCurrentAdjudication } from '@repo/eval-history/envelope/toCurrentAdjudication.util';
import { describe, expect, it } from 'vite-plus/test';

import {
  findClaimedMarkers,
  hashLines,
  markerSpelling,
} from './false-positive-markers.mjs';
import { checkFalsePositives, expiryFor } from './false-positives.mjs';

const FILE = 'packages/x/src/query.util.ts';
const CASE = 'FP-0007';
const FLAGGED = ['export const query = (table) => "select * from " + table;'];
const HASH = hashLines(FLAGGED);
const TODAY = '2026-10-30';

const marker = (overrides = {}) =>
  markerSpelling({
    analyzer: 'fallow',
    caseId: CASE,
    reason: 'the identifier comes from a fixed allow-list',
    rule: 'security/sql-concat',
    ...overrides,
  });

const source = (line = marker(), flagged = FLAGGED) =>
  [line, ...flagged, ''].join('\n');

const verifier = (model, role, verdict = 'FALSE_POSITIVE') => ({
  agent_prompt_hash: 'a'.repeat(64),
  cost_usd: null,
  duration_ms: 1,
  evidence: 'Ran the trace and found no path from input to the identifier.',
  model,
  role,
  tokens_in: 1,
  tokens_out: 1,
  verdict,
});

const envelope = (overrides = {}) => ({
  case: {
    analyzer: 'fallow',
    base_sha: '1'.repeat(40),
    case_id: CASE,
    content_hash: HASH,
    created_at: '2026-10-29T10:00:00.000Z',
    file: FILE,
    finding_id: `${FILE}:2:security/sql-concat`,
    head_sha: '2'.repeat(40),
    pr: null,
    rule: 'security/sql-concat',
  },
  outcome: 'dismissed',
  schema_version: 1,
  verifiers: [
    verifier('claude-opus-5-5', 'judge'),
    verifier('claude-sonnet-5', 'judge'),
    verifier('claude-fable-1', 'adversary'),
  ],
  ...overrides,
});

const ENTRY = {
  analyzer: 'fallow',
  case: CASE,
  contentHash: HASH,
  evidence: `docs/agents/adjudications/${CASE}.json`,
  expires: '2027-04-29',
  file: FILE,
  lines: 1,
  rule: 'security/sql-concat',
};

const check = ({
  cases = { [ENTRY.evidence]: envelope() },
  entries = [ENTRY],
  file = FILE,
  text = source(),
  today = TODAY,
} = {}) =>
  checkFalsePositives({
    entries,
    markers: findClaimedMarkers({ file, text }),
    readCase: (path) =>
      path in cases
        ? toCurrentAdjudication({ input: cases[path] })
        : { missing: true },
    readText: () => text,
    today,
  });

const kinds = (problems) => {
  for (const { message, where } of problems) {
    expect(message.length).toBeGreaterThan(15);
    expect(where).toMatch(/^(?:FP-0007|packages\/.+:\d+)$/u);
  }
  return problems.map(({ kind }) => kind);
};

const messages = (problems) => problems.map(({ message }) => message);

describe('checkFalsePositives — the one passing shape', () => {
  it('passes a marker matched one to one by a live, unanimous entry', () => {
    expect(check()).toEqual([]);
  });
});

describe('checkFalsePositives — each condition fails on its own', () => {
  it('fails a marker with no list entry', () => {
    expect(kinds(check({ entries: [] }))).toEqual(['unlisted']);
  });

  it('fails a list entry with no marker in the code', () => {
    const problems = check({ text: FLAGGED.join('\n') });
    expect(kinds(problems)).toEqual(['unmarked']);
    expect(messages(problems)).toEqual([`no marker in the code names ${CASE}`]);
  });

  it('fails a list entry with two markers', () => {
    const text = [marker(), ...FLAGGED, marker(), ...FLAGGED].join('\n');
    const problems = check({ text });
    expect(kinds(problems)).toEqual(['duplicated']);
    expect(messages(problems)).toEqual([
      `2 markers name ${CASE}; an entry has exactly one`,
    ]);
  });

  it('fails a marker with no reason', () => {
    expect(kinds(check({ text: source(marker({ reason: '' })) }))).toEqual([
      'no-reason',
    ]);
  });

  it('fails a marker that claims a false positive but names no case', () => {
    const text = source(
      '// fallow-ignore-next-line security/sql-concat -- false positive: trust me',
    );
    expect(kinds(check({ text }))).toEqual(['no-case', 'unmarked']);
  });

  it('fails an edited line, because the hash no longer matches', () => {
    const text = source(marker(), [
      'export const query = (table) => "select id from " + table;',
    ]);
    expect(kinds(check({ text }))).toEqual(['hash']);
  });

  it('fails an expired entry', () => {
    expect(
      kinds(check({ entries: [{ ...ENTRY, expires: '2026-10-29' }] })),
    ).toEqual(['expired']);
  });

  it('fails an entry that expires more than six months after the case opened', () => {
    expect(
      kinds(check({ entries: [{ ...ENTRY, expires: '2027-05-01' }] })),
    ).toEqual(['expiry-too-far']);
  });

  it('fails two verifiers on the same model', () => {
    const cases = {
      [ENTRY.evidence]: envelope({
        verifiers: [
          verifier('claude-opus-5-5', 'judge'),
          verifier('claude-sonnet-5', 'judge'),
          verifier('claude-opus-5-5', 'adversary'),
        ],
      }),
    };
    expect(kinds(check({ cases }))).toEqual(['models']);
  });

  it('fails two judges on the same model, which the schema itself refuses', () => {
    const cases = {
      [ENTRY.evidence]: envelope({
        verifiers: [
          verifier('claude-opus-5-5', 'judge'),
          verifier('claude-opus-5-5', 'judge'),
          verifier('claude-fable-1', 'adversary'),
        ],
      }),
    };
    expect(kinds(check({ cases }))).toEqual(['case-invalid']);
  });

  it('fails a split verdict', () => {
    const cases = {
      [ENTRY.evidence]: envelope({
        outcome: 'split',
        verifiers: [
          verifier('claude-opus-5-5', 'judge'),
          verifier('claude-sonnet-5', 'judge'),
          verifier('claude-fable-1', 'adversary', 'REAL'),
        ],
      }),
    };
    expect(kinds(check({ cases }))).toEqual(['not-unanimous']);
  });

  it('fails a panel of fewer than three', () => {
    const cases = {
      [ENTRY.evidence]: envelope({
        verifiers: [
          verifier('claude-opus-5-5', 'judge'),
          verifier('claude-fable-1', 'adversary'),
        ],
      }),
    };
    expect(kinds(check({ cases }))).toEqual(['models', 'roles']);
  });

  it('fails a marker whose rule differs from its entry', () => {
    const text = source(marker({ rule: 'security/eval' }));
    expect(kinds(check({ text }))).toEqual(['mismatch']);
  });

  it('fails a marker whose analyzer differs from its entry', () => {
    const text = source(marker({ analyzer: 'eslint' }));
    expect(kinds(check({ text }))).toEqual(['mismatch']);
  });

  it('fails an entry whose case file is missing', () => {
    expect(kinds(check({ cases: {} }))).toEqual(['no-case-file']);
  });

  it('fails a case file that is not a valid envelope', () => {
    const cases = { [ENTRY.evidence]: { schema_version: 1 } };
    const problems = check({ cases });
    expect(kinds(problems)).toEqual(['case-invalid']);
    expect(messages(problems)[0]).toMatch(/envelope: [^;]+; /u);
  });

  it('fails a case file that names another rule than its entry', () => {
    const cases = {
      [ENTRY.evidence]: envelope({
        case: { ...envelope().case, rule: 'security/eval' },
      }),
    };
    expect(kinds(check({ cases }))).toEqual(['case-mismatch']);
  });

  it('fails an entry missing a field, and checks nothing else about it', () => {
    const { contentHash: _dropped, ...partial } = ENTRY;
    expect(kinds(check({ entries: [partial] }))).toEqual(['entry']);
  });

  it('fails an entry whose evidence is not its own case file', () => {
    expect(
      kinds(
        check({
          entries: [
            { ...ENTRY, evidence: 'docs/agents/adjudications/FP-0001.json' },
          ],
        }),
      ),
    ).toEqual(['entry']);
  });

  it('fails a list naming one case twice', () => {
    expect(kinds(check({ entries: [ENTRY, ENTRY] }))).toContain('entry');
  });

  it('fails a marker form that covers more than the next line', () => {
    const text = source(
      `/* eslint-disable security/sql-concat -- false positive, case ${CASE}: block */`,
    );
    expect(kinds(check({ text }))).toEqual(['form', 'unmarked']);
  });
});

describe('checkFalsePositives — the edges of each condition', () => {
  it('passes an entry on its last day', () => {
    expect(check({ entries: [{ ...ENTRY, expires: TODAY }] })).toEqual([]);
  });

  it('passes an entry that expires exactly six months after the case opened', () => {
    expect(check({ entries: [{ ...ENTRY, expires: '2027-04-29' }] })).toEqual(
      [],
    );
  });

  it('hashes as many lines as the entry covers', () => {
    const flagged = [...FLAGGED, 'export const other = 1;'];
    const entries = [{ ...ENTRY, contentHash: hashLines(flagged), lines: 2 }];
    const cases = {
      [ENTRY.evidence]: envelope({
        case: { ...envelope().case, content_hash: hashLines(flagged) },
      }),
    };
    expect(check({ cases, entries, text: source(marker(), flagged) })).toEqual(
      [],
    );
    expect(
      kinds(
        check({
          cases,
          entries,
          text: source(marker(), [...FLAGGED, 'export const other = 2;']),
        }),
      ),
    ).toEqual(['hash']);
  });

  it.each([
    ['a blank field', { contentHash: '  ' }],
    ['no lines', { lines: 0 }],
    ['a fractional line count', { lines: 1.5 }],
    ['a date with a prefix', { expires: 'x2027-04-29' }],
    ['a date with a suffix', { expires: '2027-04-29x' }],
  ])('fails an entry with %s, once', (_label, change) => {
    expect(kinds(check({ entries: [{ ...ENTRY, ...change }] }))).toEqual([
      'entry',
    ]);
  });

  it('fails an entry missing its expiry once, not twice', () => {
    const { expires: _dropped, ...partial } = ENTRY;
    expect(kinds(check({ entries: [partial] }))).toEqual(['entry']);
  });

  it('fails an entry missing its evidence once, not twice', () => {
    const { evidence: _dropped, ...partial } = ENTRY;
    expect(kinds(check({ entries: [partial] }))).toEqual(['entry']);
  });

  it('fails a case recorded as fixed even when every verdict was FALSE_POSITIVE', () => {
    const cases = { [ENTRY.evidence]: envelope({ outcome: 'fixed' }) };
    expect(kinds(check({ cases }))).toEqual(['not-unanimous']);
  });

  it('fails a marker in another file than its entry', () => {
    expect(kinds(check({ file: 'packages/x/src/other.util.ts' }))).toEqual([
      'mismatch',
    ]);
  });
});

describe('expiryFor', () => {
  it('is six calendar months after the case opened', () => {
    expect(expiryFor('2026-10-29T10:00:00.000Z')).toBe('2027-04-29');
  });
});
