import { describe, expect, it } from 'vite-plus/test';

import {
  ENTRY,
  check,
  envelope,
  verifier,
} from './false-positives-fixtures.mjs';

const RULING = {
  at: '2026-11-08',
  by: 'luciocabrera',
  reference:
    'https://github.com/luciocabrera/lcabrera-stack/pull/1595#issuecomment-1',
  verdict: 'FALSE_POSITIVE',
};

const SPLIT_PANEL = [
  verifier('claude-opus-5-5', 'judge'),
  verifier('claude-sonnet-5', 'judge', 'REAL'),
  verifier('claude-fable-1', 'adversary'),
];

const ruled = ({ outcome = 'split', ruling, verifiers = SPLIT_PANEL }) => {
  const base = envelope({ outcome, verifiers });
  return ruling === undefined ? base : { ...base, owner_ruling: ruling };
};

const kindsFor = (caseEnvelope) =>
  check({ cases: { [ENTRY.evidence]: caseEnvelope } }).map(({ kind }) => kind);

const without = (field) =>
  Object.fromEntries(Object.entries(RULING).filter(([key]) => key !== field));

describe('checkFalsePositives — an owner ruling on a split panel', () => {
  it('passes a split envelope that carries a complete FALSE_POSITIVE ruling', () => {
    expect(kindsFor(ruled({ ruling: RULING }))).toEqual([]);
  });

  it('passes a fixed envelope whose fix the owner ruled a false positive', () => {
    expect(kindsFor(ruled({ outcome: 'fixed', ruling: RULING }))).toEqual([]);
  });

  it('counts the six months from the ruling, not from the day the case opened', () => {
    const late = { ...RULING, at: '2027-03-01' };
    const entry = (expires) => [{ ...ENTRY, expires }];
    const problems = (expires) =>
      check({
        cases: { [ENTRY.evidence]: ruled({ ruling: late }) },
        entries: entry(expires),
      });
    expect(problems('2027-09-01')).toEqual([]);
    expect(problems('2027-09-02').map(({ message }) => message)).toEqual([
      'expires 2027-09-02, past 2027-09-01, six months after the owner ruled',
    ]);
    expect(
      check({ entries: [{ ...ENTRY, expires: '2027-04-30' }] }).map(
        ({ message }) => message,
      ),
    ).toEqual([
      'expires 2027-04-30, past 2027-04-29, six months after the case opened',
    ]);
  });

  it('still passes a unanimous dismissal with no ruling', () => {
    expect(kindsFor(envelope())).toEqual([]);
  });

  it('still fails a split with no ruling as not-unanimous', () => {
    const problems = check({
      cases: { [ENTRY.evidence]: ruled({ ruling: undefined }) },
    });
    expect(problems.map(({ kind }) => kind)).toEqual(['not-unanimous']);
    expect(problems[0].message).toContain('no owner ruled on it');
  });

  it('fails the same split when the owner ruled REAL', () => {
    const problems = check({
      cases: {
        [ENTRY.evidence]: ruled({ ruling: { ...RULING, verdict: 'REAL' } }),
      },
    });
    expect(problems.map(({ kind }) => kind)).toEqual(['owner-ruled-real']);
    expect(problems[0].message).toBe(
      `luciocabrera ruled the split case REAL on 2026-11-08 (${RULING.reference}); fix the finding`,
    );
  });

  it.each(['at', 'by', 'reference', 'verdict'])(
    'fails the same split when the ruling has no %s',
    (field) => {
      expect(kindsFor(ruled({ ruling: without(field) }))).toEqual([
        'case-invalid',
      ]);
    },
  );

  it.each([
    { field: 'at', value: '' },
    { field: 'at', value: '2026-13-01' },
    { field: 'at', value: '2026-10-01' },
    { field: 'by', value: '' },
    { field: 'by', value: 'two words' },
    { field: 'reference', value: '' },
    { field: 'reference', value: 'the comment above' },
    { field: 'verdict', value: '' },
    { field: 'verdict', value: 'DISMISSED' },
  ])(
    'fails the same split when the ruling has $field "$value"',
    ({ field, value }) => {
      expect(
        kindsFor(ruled({ ruling: { ...RULING, [field]: value } })),
      ).toEqual(['case-invalid']);
    },
  );

  it('fails a ruling that is not an object', () => {
    expect(kindsFor(ruled({ ruling: 'FALSE_POSITIVE' }))).toEqual([
      'case-invalid',
    ]);
  });

  it('does not let a ruling replace the three seats or their roles', () => {
    expect(
      kindsFor(ruled({ ruling: RULING, verifiers: SPLIT_PANEL.slice(0, 2) })),
    ).toEqual(['models', 'roles']);
    expect(
      kindsFor(
        ruled({
          ruling: RULING,
          verifiers: [
            verifier('claude-opus-5-5', 'judge'),
            verifier('claude-sonnet-5', 'adversary', 'REAL'),
            verifier('claude-fable-1', 'adversary'),
          ],
        }),
      ),
    ).toEqual(['roles']);
  });

  it('fails a ruling on an escalated case, which no owner ruling closes', () => {
    const allReal = SPLIT_PANEL.map((seat) => ({ ...seat, verdict: 'REAL' }));
    expect(
      kindsFor(
        ruled({ outcome: 'escalated', ruling: RULING, verifiers: allReal }),
      ),
    ).toEqual(['case-invalid']);
  });
});
