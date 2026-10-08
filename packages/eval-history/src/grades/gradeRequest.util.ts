import { TRIAL_ID } from './grades.constants.ts';
import { parseScoreArgument } from './parseScoreArgument.util.ts';

type GradeRequestArgs = {
  readonly agreement: boolean;
  readonly grader: string;
  readonly scores: readonly string[];
  readonly trial: string | undefined;
};

export const gradeRequest = ({
  agreement,
  grader,
  scores,
  trial,
}: GradeRequestArgs) => {
  if (agreement) {
    return { kind: 'agreement' } as const;
  }

  if (trial === undefined || !TRIAL_ID.test(trial)) {
    return {
      kind: 'invalid',
      problems: [
        'name the trial to grade with --trial <id>, or pass --agreement',
      ],
    } as const;
  }

  const parsed = scores.map((argument) => parseScoreArgument(argument));
  const problems = parsed.flatMap((entry) =>
    entry.kind === 'problem' ? [entry.problem] : [],
  );

  return problems.length > 0
    ? ({ kind: 'invalid', problems } as const)
    : ({
        grader,
        kind: 'grade',
        scores: parsed.flatMap((entry) =>
          entry.kind === 'score'
            ? [{ dimension: entry.dimension, score: entry.score }]
            : [],
        ),
        trialId: trial,
      } as const);
};
