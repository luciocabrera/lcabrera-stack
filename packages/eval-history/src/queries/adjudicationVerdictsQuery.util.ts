import { projectedRelation } from './projectedRelation.util.ts';

type AdjudicationVerdictsQueryArgs = {
  readonly publicColumns: ReadonlySet<string>;
};

export const adjudicationVerdictsQuery = ({
  publicColumns,
}: AdjudicationVerdictsQueryArgs) => ({
  text: `select
  verdict.case_id as "caseId",
  verdict.verifier_role::text as role,
  verdict.model,
  verdict.agent_prompt_hash as "agentPromptHash",
  verdict.verdict::text as verdict,
  verdict.duration_ms as "durationMs",
  verdict.tokens_in as "tokensIn",
  verdict.tokens_out as "tokensOut",
  verdict.cost_usd::double precision as "costUsd"
from ${projectedRelation({ columns: ['case_id', 'verifier_role', 'model', 'agent_prompt_hash', 'verdict', 'duration_ms', 'tokens_in', 'tokens_out', 'cost_usd'], publicColumns, table: 'adjudication_verdict' })} verdict
order by verdict.case_id, verdict.verifier_role, verdict.model`,
  values: [],
});
