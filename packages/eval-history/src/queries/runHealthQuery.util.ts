import { projectedRelation } from './projectedRelation.util.ts';

type RunHealthQueryArgs = {
  readonly publicColumns: ReadonlySet<string>;
  readonly runIds: readonly string[];
};

export const runHealthQuery = ({
  publicColumns,
  runIds,
}: RunHealthQueryArgs) => ({
  text: `select
  trial.run_id::text as "runId",
  trial.outcome::text as outcome,
  trial.error_class as "errorClass",
  count(*)::integer as trials
from ${projectedRelation({ columns: ['run_id', 'outcome', 'error_class'], publicColumns, table: 'eval_trial' })} trial
where trial.run_id = any($1::uuid[])
  and trial.outcome in ('error', 'timeout')
group by trial.run_id, trial.outcome, trial.error_class
order by trial.run_id, trial.outcome, trial.error_class nulls first`,
  values: [[...runIds]],
});
