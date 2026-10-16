import type { HumanScore } from './grades.types.ts';

type GradeProblemsArgs = {
  readonly judged: readonly string[];
  readonly scores: readonly HumanScore[];
  readonly trialId: string;
};

export const gradeProblems = ({
  judged,
  scores,
  trialId,
}: GradeProblemsArgs) => {
  if (judged.length === 0) {
    return [`trial ${trialId} has no quality judgement to grade`];
  }

  const named = scores.map(({ dimension }) => dimension);
  const scored = `the judge scored ${judged.join(', ')}`;

  return [
    ...(named.length === 0
      ? [`name at least one --score <dimension>=<1-5>; ${scored}`]
      : []),
    ...named
      .filter((dimension) => !judged.includes(dimension))
      .map((dimension) => `"${dimension}" is not a dimension ${scored}`),
    ...named
      .filter((dimension, index) => named.indexOf(dimension) !== index)
      .map((dimension) => `"${dimension}" is scored more than once`),
  ];
};
