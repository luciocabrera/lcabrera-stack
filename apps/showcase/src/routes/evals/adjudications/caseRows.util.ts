import type {
  AdjudicationCase,
  AdjudicationVerdict,
} from './EvalsAdjudications.types';

import { costLabel } from '../utils/costLabel.util';
import { durationLabel } from '../utils/durationLabel.util';
import {
  EVALS_ADJUDICATION_CASES,
  UNRECORDED_BUILDER,
} from './EvalsAdjudications.constants';
import { panelTally } from './panelTally.util';
import { summedCost } from './summedCost.util';
import { truthLabel } from './truthLabel.util';
import { verdictsByCase } from './verdictsByCase.util';

type CaseRowsArgs = {
  readonly cases: readonly AdjudicationCase[];
  readonly verdicts: readonly AdjudicationVerdict[];
};

export const caseRows = ({ cases, verdicts }: CaseRowsArgs) => {
  const byCase = verdictsByCase(verdicts);

  return {
    rows: cases.slice(0, EVALS_ADJUDICATION_CASES).map((adjudicated) => {
      const seats = byCase.get(adjudicated.caseId) ?? [];

      return {
        analyzer: adjudicated.analyzer,
        builder: adjudicated.builderModel ?? UNRECORDED_BUILDER,
        caseId: adjudicated.caseId,
        cost: costLabel(summedCost(seats.map(({ costUsd }) => costUsd))),
        duration:
          seats.length === 0
            ? 'no verdict'
            : durationLabel(
                Math.max(...seats.map(({ durationMs }) => durationMs)),
              ),
        id: adjudicated.caseId,
        opened: adjudicated.createdAt.toISOString().slice(0, 10),
        outcome: adjudicated.outcome,
        panel: panelTally(seats),
        pr: adjudicated.pr === undefined ? '' : `#${String(adjudicated.pr)}`,
        rule: adjudicated.rule,
        truth: truthLabel(adjudicated),
      };
    }),
    total: cases.length,
  };
};
