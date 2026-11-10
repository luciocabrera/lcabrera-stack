import { describe, expect, it } from 'vite-plus/test';

import { adjudication, CASES, VERDICTS } from './adjudications.fixtures';
import { caseRows } from './caseRows.util';
import { EVALS_ADJUDICATION_CASES } from './EvalsAdjudications.constants';

describe('caseRows', () => {
  const { rows, total } = caseRows({ cases: CASES, verdicts: VERDICTS });

  it('keeps the newest-first order the reader returned', () => {
    expect(total).toBe(4);
    expect(rows.map(({ caseId }) => caseId)).toEqual([
      'FP-0004',
      'FP-0003',
      'FP-0002',
      'FP-0001',
    ]);
  });

  it('gives each case its panel, true answer, cost and slowest seat', () => {
    expect(rows[0]).toEqual({
      analyzer: 'oxlint',
      builder: 'claude-opus-5-5',
      caseId: 'FP-0004',
      cost: '$1.20',
      duration: '1m 30s',
      id: 'FP-0004',
      opened: '2026-11-04',
      outcome: 'fixed',
      panel: '3 REAL',
      pr: '#1594',
      rule: 'unicorn/no-nested-ternary',
      truth: 'none yet',
    });
    expect(rows[2]).toMatchObject({
      builder: 'not recorded',
      cost: '$0.20',
      panel: '2 FALSE_POSITIVE, 1 REAL',
      pr: '',
      truth: 'REAL (lucio)',
    });
  });

  it('shows a case with no verdict stored', () => {
    expect(
      caseRows({ cases: [adjudication({ caseId: 'FP-0007' })], verdicts: [] })
        .rows[0],
    ).toMatchObject({
      cost: 'not reported',
      duration: 'no verdict',
      panel: 'no verdict',
    });
  });

  it('shows only the newest cases past the limit, and counts them all', () => {
    const many = Array.from(
      { length: EVALS_ADJUDICATION_CASES + 1 },
      (_, index) => adjudication({ caseId: `FP-${String(index + 1000)}` }),
    );
    const capped = caseRows({ cases: many, verdicts: [] });

    expect(capped.rows).toHaveLength(EVALS_ADJUDICATION_CASES);
    expect(capped.total).toBe(EVALS_ADJUDICATION_CASES + 1);
    expect(capped.rows.at(-1)?.caseId).toBe(
      `FP-${String(EVALS_ADJUDICATION_CASES + 999)}`,
    );
  });
});
