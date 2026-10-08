import {
  envelopeShapeSchema,
  trialDetailSchema,
} from '../envelope/envelope.schema.ts';

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

export const ALLOWED_TEXT_COLUMNS = [
  'eval_baseline.git_sha',
  'eval_baseline.metric',
  'eval_baseline.model_id',
  'eval_baseline.suite',
  'eval_human_grade.dimension',
  'eval_run.branch',
  'eval_run.catalog_hash',
  'eval_run.git_sha',
  'eval_run.harness_version',
  'eval_run.model_id',
  'eval_run.project',
  'eval_run.sdk_version',
  'eval_run.suite',
  'eval_subject.name',
  'eval_subject_version.content_hash',
  'eval_subject_version.first_seen_sha',
  'eval_task.source',
  'eval_task.suite',
  'eval_task.tags',
  'eval_task.task_key',
  'eval_task_version.agent_prompt_hash',
  'eval_task_version.expected_hash',
  'eval_task_version.fixture_hash',
  'eval_task_version.judge_prompt_hash',
  'eval_task_version.task_hash',
  'eval_tool_call.tool',
  'eval_trial.error_class',
  'eval_trial_detail.detail_schema',
  'model_price.model_id',
  'suite.name',
] as const;

export const PUBLIC_FIELD_PATHS = [
  'eval_run.env.arch',
  'eval_run.env.ci_runner',
  'eval_run.env.node',
  'eval_run.env.os',
  'eval_run.settings.concurrency',
  'eval_run.settings.hidden',
  'eval_run.settings.max_turns',
  'eval_run.settings.runs',
  'eval_run.settings.selection',
  'eval_run.settings.timeout_ms',
  'eval_run.settings.tools',
  'eval_trial_detail.detail.dimensions[].name',
  'eval_trial_detail.detail.dimensions[].score',
  'eval_trial_detail.detail.expected_not_met',
  'eval_trial_detail.detail.expected_skill',
  'eval_trial_detail.detail.invoked',
  'eval_trial_detail.detail.not_met',
  'eval_trial_detail.detail.overall',
  'eval_trial_detail.detail.verdict',
] as const;

export const ALLOWED_WHOLE_JSONB = ['eval_run.totals'] as const;

export const TEXT_TYPES = ['character', 'character varying', 'text'] as const;

export const TEXT_ARRAY_UDT_NAMES = ['_bpchar', '_text', '_varchar'] as const;

export const EVALS_BASE_COLUMNS_SQL = `select
  columns.table_name as "table",
  columns.column_name as "column",
  columns.data_type as "dataType",
  columns.udt_name as "udtName"
from information_schema.columns columns
join information_schema.tables tables
  on tables.table_schema = columns.table_schema
  and tables.table_name = columns.table_name
where columns.table_schema = 'evals'
  and tables.table_type = 'BASE TABLE'
order by columns.table_name, columns.ordinal_position`;

export const JSONB_COLUMN_SCHEMAS = {
  'eval_run.env': envelopeShapeSchema.shape.run.shape.env,
  'eval_run.settings': envelopeShapeSchema.shape.run.shape.settings,
  'eval_run.totals': envelopeShapeSchema.shape.run.shape.totals,
  'eval_trial_detail.detail': trialDetailSchema,
} as const;

export const TRIAL_SORT_EXPRESSIONS = {
  costUsd: 'trial.cost_usd_reported',
  durationMs: 'trial.duration_ms',
  errorClass: 'trial.error_class',
  outcome: 'trial.outcome',
  subjectName: 'subject.name',
  taskKey: 'task.task_key',
  taskKind: 'task.kind',
  tokensIn: 'trial.tokens_in',
  tokensOut: 'trial.tokens_out',
  trialId: 'trial.id',
  trialIndex: 'trial.trial_index',
  turns: 'trial.turns',
} as const;
