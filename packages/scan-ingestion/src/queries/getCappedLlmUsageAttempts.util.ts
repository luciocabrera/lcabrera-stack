import { selectRows } from '@repo/server/db/select-rows.util';

import { LLM_USAGE_SCHEMA } from './llmUsage.constants.ts';

export type CappedLlmUsageAttemptRow = {
  readonly created_at: Date;
  readonly error_message: null | string;
  readonly id: string;
  readonly project_id: string;
  readonly project_name: string;
  readonly run_id: string;
  readonly scan_id: string;
  readonly scanner_display_name: string;
  readonly scanner_id: string;
  readonly triggered_by: null | string;
};

type GetCappedLlmUsageAttemptsArgs = {
  readonly limit?: number;
};

const FIELDS = [
  'id',
  'scan_id',
  'run_id',
  'project_id',
  'project_name',
  'scanner_id',
  'scanner_display_name',
  'triggered_by',
  'error_message',
  'created_at',
] as const;

/** Budget-cap skips — attempts that never called the Agent SDK at all — most recent first. */
export const getCappedLlmUsageAttempts = async ({
  limit = 100,
}: GetCappedLlmUsageAttemptsArgs = {}): Promise<
  readonly CappedLlmUsageAttemptRow[]
> =>
  await selectRows<CappedLlmUsageAttemptRow>({
    fields: FIELDS,
    limit,
    schema: LLM_USAGE_SCHEMA,
    sort: [{ column: 'created_at', direction: 'desc' }],
    table: 'v_capped_llm_usage_attempts',
  });
