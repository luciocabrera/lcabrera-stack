import type { Suite } from './report.types.ts';

type LatestRunQueryArgs = {
  readonly branch: string;
  readonly suite: Suite;
};

export const latestRunQuery = ({ branch, suite }: LatestRunQueryArgs) => ({
  text: `select run_id::text as "runId"
from evals.eval_run
where branch = $1 and suite = $2 and status = 'complete'
order by started_at desc
limit 1`,
  values: [branch, suite],
});
