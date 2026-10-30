export const adjudicationAccuracyQuery = () => ({
  text: `select
  model,
  verifier_role::text as "verifierRole",
  verdicts,
  correct,
  missed_real as "missedReal",
  false_alarms as "falseAlarms"
from evals.v_adjudication_accuracy
order by model, verifier_role`,
  values: [],
});
