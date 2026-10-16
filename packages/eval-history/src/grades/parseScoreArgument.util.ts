import { HUMAN_SCORE_RANGE, SCORE_ARGUMENT } from './grades.constants.ts';

export const parseScoreArgument = (argument: string) => {
  const groups = SCORE_ARGUMENT.exec(argument)?.groups;
  const score = Number(groups?.score);

  if (
    groups?.dimension === undefined ||
    !Number.isSafeInteger(score) ||
    score < HUMAN_SCORE_RANGE.min ||
    score > HUMAN_SCORE_RANGE.max
  ) {
    return {
      kind: 'problem',
      problem: `--score ${argument} is not <dimension>=<a whole number from ${String(HUMAN_SCORE_RANGE.min)} to ${String(HUMAN_SCORE_RANGE.max)}>`,
    } as const;
  }

  return { dimension: groups.dimension, kind: 'score', score } as const;
};
