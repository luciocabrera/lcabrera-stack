import type { GroundTruth } from './adjudications.types.ts';

export const recordGroundTruthQuery = ({
  caseId,
  note,
  source,
  truth,
}: GroundTruth) => ({
  text: `insert into evals.adjudication_ground_truth (case_id, truth, source, note)
values ($1, $2, $3, $4)
returning recorded_at`,
  values: [caseId, truth, source, note],
});
