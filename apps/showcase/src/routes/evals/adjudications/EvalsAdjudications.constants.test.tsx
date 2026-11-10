// @vitest-environment jsdom

import { StatusBadge } from '@lcabrera/ui/components/StatusBadge';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { CaseRow } from './EvalsAdjudications.types';

import { HEAT_TONES } from '../heatmap/EvalsHeatmap.constants';
import { CASES, VERDICTS } from './adjudications.fixtures';
import { caseRows } from './caseRows.util';
import {
  ACCURACY_COLUMNS,
  ACCURACY_LEGEND,
  BUILDER_COLUMNS,
  CASE_COLUMNS,
  COST_COLUMNS,
  EVALS_ADJUDICATIONS_HANDLE,
  PROMPT_COLUMNS,
  RULE_COLUMNS,
} from './EvalsAdjudications.constants';

type Descriptor = {
  readonly align?: string;
  readonly dataType?: string;
  readonly key: string;
  readonly label: string;
};

const shape = (columns: readonly Descriptor[]) =>
  columns.map(({ align, dataType, key, label }) => [
    key,
    label,
    align,
    dataType,
  ]);

const COUNT = ['end', 'number'] as const;

const badgeClass = (row: CaseRow) => {
  const outcome = CASE_COLUMNS.find(({ key }) => key === 'outcome');
  const { container } = render(<>{outcome?.render?.(row)}</>);

  return container.firstElementChild?.className;
};

const toneClass = (tone: 'error' | 'info' | 'success' | 'warning') => {
  const { container } = render(<StatusBadge label='x' tone={tone} />);

  return container.firstElementChild?.className;
};

afterEach(cleanup);

describe('the adjudications page columns', () => {
  it('lays out the cases with the dates as text and the figures right-aligned', () => {
    expect(shape(CASE_COLUMNS)).toEqual([
      ['caseId', 'Case', undefined, undefined],
      ['opened', 'Opened', undefined, 'string'],
      ['analyzer', 'Analyzer', undefined, undefined],
      ['rule', 'Rule', undefined, undefined],
      ['pr', 'PR', undefined, undefined],
      ['outcome', 'Outcome', undefined, undefined],
      ['panel', 'Panel', undefined, undefined],
      ['truth', 'True answer', undefined, undefined],
      ['cost', 'Cost', 'end', undefined],
      ['duration', 'Slowest seat', 'end', undefined],
      ['builder', 'Builder model', undefined, undefined],
    ]);
  });

  it('lays out accuracy per model and per prompt', () => {
    expect(shape(ACCURACY_COLUMNS)).toEqual([
      ['model', 'Model', undefined, undefined],
      ['role', 'Role', undefined, undefined],
      ['verdicts', 'Verdicts', ...COUNT],
      ['correct', 'Correct', ...COUNT],
      ['accuracy', 'Accuracy', 'end', undefined],
      ['interval', 'Interval', undefined, undefined],
      ['missedReal', 'Missed a real finding', ...COUNT],
      ['falseAlarms', 'Called a false positive real', ...COUNT],
    ]);
    expect(shape(PROMPT_COLUMNS)).toEqual([
      ['role', 'Role', undefined, undefined],
      ['prompt', 'Prompt hash', undefined, undefined],
      ['firstSeen', 'First case', undefined, 'string'],
      ['verdicts', 'Verdicts', ...COUNT],
      ['accuracy', 'Accuracy', 'end', undefined],
    ]);
  });

  it('lays out the rule, cost and builder tables', () => {
    expect(shape(RULE_COLUMNS)).toEqual([
      ['analyzer', 'Analyzer', undefined, undefined],
      ['rule', 'Rule', undefined, undefined],
      ['cases', 'Cases', ...COUNT],
      ['dismissed', 'Dismissed', ...COUNT],
      ['answered', 'With a true answer', ...COUNT],
      ['falsePositives', 'False positives', ...COUNT],
      ['rate', 'False-positive rate', 'end', undefined],
      ['reopened', 'Reopened', ...COUNT],
    ]);
    expect(shape(COST_COLUMNS)).toEqual([
      ['model', 'Model', undefined, undefined],
      ['verdicts', 'Verdicts', ...COUNT],
      ['cases', 'Cases', ...COUNT],
      ['cost', 'Reported cost', 'end', undefined],
      ['costPerVerdict', 'Per verdict', 'end', undefined],
      ['duration', 'Mean time', 'end', undefined],
      ['tokensIn', 'Tokens in', ...COUNT],
      ['tokensOut', 'Tokens out', ...COUNT],
    ]);
    expect(shape(BUILDER_COLUMNS)).toEqual([
      ['builder', 'Builder model', undefined, undefined],
      ['cases', 'Cases', ...COUNT],
      ['dismissed', 'Dismissed', ...COUNT],
      ['accuracy', 'Panel accuracy', 'end', undefined],
    ]);
  });

  it('badges each outcome in its own tone', () => {
    const rows = caseRows({ cases: CASES, verdicts: VERDICTS }).rows;
    const [fixed, dismissed, split] = rows;
    const tones = {
      dismissed: 'success',
      escalated: 'error',
      fixed: 'info',
      split: 'warning',
    } as const;

    expect(
      [fixed, dismissed, split].map((row) =>
        row === undefined ? undefined : badgeClass(row),
      ),
    ).toEqual([
      toneClass(tones.fixed),
      toneClass(tones.dismissed),
      toneClass(tones.split),
    ]);
    expect(
      dismissed === undefined
        ? undefined
        : badgeClass({ ...dismissed, outcome: 'escalated' }),
    ).toBe(toneClass(tones.escalated));
  });

  it('names each accuracy band in the heatmap legend', () => {
    expect(ACCURACY_LEGEND).toEqual([
      { label: '90% or more correct', tone: HEAT_TONES.high },
      { label: '50% or more correct', tone: HEAT_TONES.mid },
      { label: 'Below 50% correct', tone: HEAT_TONES.low },
      { label: 'No true answer yet', tone: HEAT_TONES.none },
    ]);
  });

  it('trails back to the overview', () => {
    expect(EVALS_ADJUDICATIONS_HANDLE.breadcrumb()).toEqual([
      { label: 'Evals', to: '/evals' },
      { label: 'adjudications' },
    ]);
  });
});
