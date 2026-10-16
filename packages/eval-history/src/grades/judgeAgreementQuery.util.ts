export const judgeAgreementQuery = () => ({
  text: `select
  judge_model as "judgeModel",
  judge_prompt_hash as "judgePromptHash",
  judge_score as "judgeScore",
  human_score as "humanScore"
from evals.v_judge_agreement
order by judge_model, judge_prompt_hash, trial_id, dimension`,
  values: [],
});
