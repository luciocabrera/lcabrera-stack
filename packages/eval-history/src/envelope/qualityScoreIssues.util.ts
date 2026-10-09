import type { TrialDetail } from './envelope.types.ts';

type QualityScoreIssuesArgs = {
  readonly detail: TrialDetail;
  readonly index: number;
};

export const qualityScoreIssues = ({
  detail,
  index,
}: QualityScoreIssuesArgs) => {
  if (detail.schema !== 'quality/1') {
    return [];
  }

  const names = detail.dimensions.map(({ name }) => name);

  return detail.dimensions.flatMap(({ name, score }, position) => [
    ...(Number.isSafeInteger(score) && score >= 1 && score <= 5
      ? []
      : [
          {
            code: 'custom' as const,
            message: `dimension ${name} scores ${String(score)}, not a whole number from 1 to 5`,
            path: ['trials', index, 'detail', 'dimensions', position, 'score'],
          },
        ]),
    ...(names.indexOf(name) === position
      ? []
      : [
          {
            code: 'custom' as const,
            message: `dimension ${name} is scored more than once`,
            path: ['trials', index, 'detail', 'dimensions', position, 'name'],
          },
        ]),
  ]);
};
