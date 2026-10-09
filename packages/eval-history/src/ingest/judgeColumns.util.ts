import type { TrialDetail } from '../envelope/envelope.types.ts';

export const judgeColumns = (detail: TrialDetail) =>
  detail.schema === 'quality/1'
    ? {
        dimensions: detail.dimensions.map(({ name }) => name),
        judgeModel: detail.judge_model,
        scores: detail.dimensions.map(({ score }) => score),
      }
    : { dimensions: [], judgeModel: undefined, scores: [] };
