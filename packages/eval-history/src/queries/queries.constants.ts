export const EXCLUDED_TABLES = ['schema_migration'] as const;

export const EXCLUDED_COLUMNS = [
  'eval_annotation.author',
  'eval_annotation.text',
  'eval_human_grade.grader',
  'eval_run.actor',
  'eval_run.envelope_sha256',
  'eval_subject.path',
  'eval_subject_version.content',
  'eval_tool_call.input_summary',
  'eval_trial.transcript_bytes',
  'eval_trial.transcript_expires_at',
  'eval_trial.transcript_sha',
  'eval_trial.transcript_uri',
  'eval_trial_detail.detail',
] as const;

export const REPORTING_RELATIONS = [
  'flaky_tasks',
  'run_compare',
  'v_subject_trend',
  'v_task_pass_rate',
] as const;
