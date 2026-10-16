type RunCompareQueryArgs = {
  readonly a: string;
  readonly b: string;
};

export const runCompareQuery = ({ a, b }: RunCompareQueryArgs) => ({
  text: `select
  suite,
  task_key as "taskKey",
  subject_kind as "subjectKind",
  subject_name as "subjectName",
  to_json(outcomes_a) as "outcomesA",
  to_json(outcomes_b) as "outcomesB",
  n_a as "nA",
  k_a as "kA",
  n_b as "nB",
  k_b as "kB",
  task_hash_a as "taskHashA",
  task_hash_b as "taskHashB",
  fixture_hash_a as "fixtureHashA",
  fixture_hash_b as "fixtureHashB",
  expected_hash_a as "expectedHashA",
  expected_hash_b as "expectedHashB",
  judge_prompt_hash_a as "judgePromptHashA",
  judge_prompt_hash_b as "judgePromptHashB",
  agent_prompt_hash_a as "agentPromptHashA",
  agent_prompt_hash_b as "agentPromptHashB",
  content_hash_a as "contentHashA",
  content_hash_b as "contentHashB"
from evals.run_compare($1, $2)
order by suite, task_key`,
  values: [a, b],
});
