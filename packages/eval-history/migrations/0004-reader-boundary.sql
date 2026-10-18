alter view evals.v_task_pass_rate set (security_invoker = true);
alter view evals.v_subject_trend set (security_invoker = true);
alter view evals.v_judge_agreement set (security_invoker = true);

alter table evals.eval_run
  add column env_public jsonb generated always as (
    json_object(
      'arch': env -> 'arch',
      'ci_runner': env -> 'ci_runner',
      'node': env -> 'node',
      'os': env -> 'os'
      absent on null returning jsonb
    )
  ) stored,
  add column settings_public jsonb generated always as (
    json_object(
      'concurrency': settings -> 'concurrency',
      'hidden': settings -> 'hidden',
      'max_turns': settings -> 'max_turns',
      'runs': settings -> 'runs',
      'selection': settings -> 'selection',
      'timeout_ms': settings -> 'timeout_ms',
      'tools': settings -> 'tools'
      absent on null returning jsonb
    )
  ) stored;

alter table evals.eval_trial_detail
  add column detail_public jsonb generated always as (
    json_object(
      'expected_not_met': detail -> 'expected_not_met',
      'expected_skill': detail -> 'expected_skill',
      'invoked': detail -> 'invoked',
      'judge_model': detail -> 'judge_model',
      'not_met': detail -> 'not_met',
      'overall': detail -> 'overall',
      'verdict': detail -> 'verdict'
      absent on null returning jsonb
    )
  ) stored;
