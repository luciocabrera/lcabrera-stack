import type { ScoredVerdict } from './EvalsAdjudications.types';

import { accuracyLabel } from './accuracyLabel.util';

type TrendStep = {
  readonly caseId: string;
  readonly correct: number;
  readonly createdAt: Date;
  readonly scored: number;
};

export const accuracyTrend = (verdicts: readonly ScoredVerdict[]) => {
  const scored = verdicts
    .filter(({ isCorrect }) => isCorrect !== undefined)
    .toSorted(
      (left, right) =>
        left.createdAt.getTime() - right.createdAt.getTime() ||
        left.caseId.localeCompare(right.caseId),
    );
  const models = [...new Set(scored.map(({ model }) => model))].toSorted(
    (left, right) => left.localeCompare(right),
  );

  return models.map((model) => {
    const steps = scored
      .filter((verdict) => verdict.model === model)
      .reduce<TrendStep[]>((running, verdict) => {
        const previous = running.at(-1);

        running.push({
          caseId: verdict.caseId,
          correct: (previous?.correct ?? 0) + (verdict.isCorrect ? 1 : 0),
          createdAt: verdict.createdAt,
          scored: (previous?.scored ?? 0) + 1,
        });

        return running;
      }, []);

    return {
      model,
      points: steps.map(({ caseId, correct, createdAt, scored: total }) => ({
        at: createdAt.toISOString(),
        label: `${model} after ${caseId}: ${accuracyLabel({ correct, scored: total })}`,
        value: correct / total,
      })),
    };
  });
};
