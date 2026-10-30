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
  text = source(),
  today = TODAY,
} = {}) =>
  checkFalsePositives({
    entries,
    markers: findClaimedMarkers({ file: FILE, text }),
    readCase: (path) =>
      path in cases
        ? toCurrentAdjudication({ input: cases[path] })
        : { missing: true },
    readText: () => text,
    today,
  });

const kinds = (problems) => problems.map(({ kind }) => kind);

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
    expect(kinds(check({ text: FLAGGED.join('\n') }))).toEqual(['unmarked']);
  });

  it('fails a list entry with two markers', () => {
    const text = [marker(), ...FLAGGED, marker(), ...FLAGGED].join('\n');
    expect(kinds(check({ text }))).toContain('duplicated');
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
    expect(kinds(check({ cases }))).toEqual(['case-invalid']);
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

describe('findClaimedMarkers', () => {
  it.each([
    ['eslint', 'eslint-disable-next-line'],
    ['oxlint', 'oxlint-disable-next-line'],
    ['react-doctor', 'react-doctor-disable-next-line'],
    ['fallow', 'fallow-ignore-next-line'],
  ])('reads the %s spelling', (analyzer, directive) => {
    const [found] = findClaimedMarkers({
      file: FILE,
      text: `  // ${directive} some/rule -- false positive, case FP-0012: reason here`,
    });
    expect(found).toMatchObject({
      analyzer,
      caseId: 'FP-0012',
      line: 1,
      reason: 'reason here',
      rule: 'some/rule',
    });
  });

  it("reads Biome's colon-separated spelling, in JSX too", () => {
    const [found] = findClaimedMarkers({
      file: FILE,
      text: '{/* biome-ignore lint/a11y/useButtonType: false positive, case FP-0003: a native reset */}',
    });
    expect(found).toMatchObject({
      analyzer: 'biome',
      caseId: 'FP-0003',
      reason: 'a native reset',
      rule: 'lint/a11y/useButtonType',
    });
  });

  it('ignores a marker that claims nothing, and one inside a string', () => {
    expect(
      findClaimedMarkers({
        file: FILE,
        text: [
          '// eslint-disable-next-line no-console -- logging',
          "const text = '// eslint-disable-next-line x -- false positive, case FP-0001: y';",
        ].join('\n'),
      }),
    ).toEqual([]);
  });
});

describe('expiryFor', () => {
  it('is six calendar months after the case opened', () => {
    expect(expiryFor('2026-10-29T10:00:00.000Z')).toBe('2027-04-29');
  });
});
