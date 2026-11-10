import { describe, expect, it } from 'vite-plus/test';

import { CASES, VERDICTS } from './adjudications.fixtures';
import { scoredVerdicts } from './scoredVerdicts.util';

describe('scoredVerdicts', () => {
  const scored = scoredVerdicts({ cases: CASES, verdicts: VERDICTS });

  it('joins each verdict to its case, in case order', () => {
    expect(scored.map(({ caseId }) => caseId)).toEqual(
      ['FP-0004', 'FP-0003', 'FP-0002', 'FP-0001'].flatMap((id) => [
        id,
        id,
        id,
      ]),
    );
    expect(scored[0]).toMatchObject({
      analyzer: 'oxlint',
      builderModel: 'claude-opus-5-5',
      createdAt: new Date('2026-11-04T10:00:00.000Z'),
      rule: 'unicorn/no-nested-ternary',
    });
  });

  it('scores a verdict only once its case has a true answer', () => {
    expect(
      scored.map(({ caseId, isCorrect, role }) => [caseId, role, isCorrect]),
    ).toEqual([
      ['FP-0004', 'judge', undefined],
      ['FP-0004', 'judge', undefined],
      ['FP-0004', 'adversary', undefined],
      ['FP-0003', 'judge', false],
      ['FP-0003', 'judge', false],
      ['FP-0003', 'adversary', false],
      ['FP-0002', 'judge', false],
      ['FP-0002', 'judge', false],
      ['FP-0002', 'adversary', true],
      ['FP-0001', 'judge', true],
      ['FP-0001', 'judge', true],
      ['FP-0001', 'adversary', true],
    ]);
  });

  it('leaves out a verdict whose case was not read', () => {
    expect(
      scoredVerdicts({ cases: CASES.slice(0, 1), verdicts: VERDICTS }),
    ).toHaveLength(3);
  });
});
