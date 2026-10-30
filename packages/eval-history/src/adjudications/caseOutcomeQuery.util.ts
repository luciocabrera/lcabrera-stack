export const caseOutcomeQuery = (caseId: string) => ({
  text: `select outcome::text as outcome
from evals.adjudication_case
where case_id = $1`,
  values: [caseId],
});
