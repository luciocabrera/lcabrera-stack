type FlakyTasksQueryArgs = {
  readonly disagreeFraction: number;
  readonly window: number;
};

export const flakyTasksQuery = ({
  disagreeFraction,
  window,
}: FlakyTasksQueryArgs) => ({
  text: `select
  suite,
  task_key as "taskKey",
  runs,
  disagreeing,
  disagree_fraction as "disagreeFraction"
from evals.flaky_tasks($1)
where disagreeing > $2::double precision * runs
order by disagree_fraction desc, task_key`,
  values: [window, disagreeFraction],
});
