type FlakyTasksQueryArgs = {
  readonly disagreeFraction: number;
  readonly excludedRuns?: readonly string[];
  readonly window: number;
};

export const flakyTasksQuery = ({
  disagreeFraction,
  excludedRuns = [],
  window,
}: FlakyTasksQueryArgs) => ({
  text: `select
  suite,
  task_key as "taskKey",
  runs,
  disagreeing,
  disagree_fraction as "disagreeFraction"
from evals.flaky_tasks($1, $3::uuid[])
where disagreeing > $2::double precision * runs
order by disagree_fraction desc, task_key`,
  values: [window, disagreeFraction, [...excludedRuns]],
});
