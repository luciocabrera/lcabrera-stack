import type { GroundTruth } from './adjudications.types.ts';

type GroundTruthProblemsArgs = Pick<GroundTruth, 'caseId' | 'source'> & {
  readonly outcome: string | undefined;
};

export const groundTruthProblems = ({
  caseId,
  outcome,
  source,
}: GroundTruthProblemsArgs) => {
  if (outcome === undefined) {
    return [
      `case ${caseId} is not stored; ingest its envelope with vp run evals:ingest first`,
    ];
  }

  return source === 'reopened' && outcome !== 'dismissed'
    ? [
        `case ${caseId} was ${outcome}, not dismissed: only a dismissal is reopened`,
      ]
    : [];
};
