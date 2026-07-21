import type { QuerySort } from '@repo/server/db/query-builder/query-builder.types';
import type { QueryResultRow } from 'pg';

import { selectRows } from '@repo/server/db/select-rows.util';

import { LLM_USAGE_SCHEMA } from './llmUsage.constants.ts';

/**
 * Every `llm_usage` cost view exposes the cost as a Postgres `numeric`, which
 * the pg driver hands back as a **string** — hence the string-typed column
 * here and the coercion below.
 */
type LlmCostDbRow = {
  readonly total_cost_usd: string;
};

type SelectLlmCostRowsArgs = {
  readonly fields: readonly string[];
  readonly sort: readonly QuerySort[];
  readonly table: string;
};

/**
 * Reads one of the `llm_usage` cost roll-up views, returning `total_cost_usd`
 * as a JS number. The three cost readers differ only in view, columns, and
 * sort — everything else (schema, execution, numeric coercion) lives here so
 * a fix lands once.
 *
 * `total_cost_usd` is rest-destructured out **before** the spread on purpose:
 * spreading a generic row and overriding the key instead (`{ ...row,
 * total_cost_usd: Number(...) }`) makes TypeScript compute
 * `TRow & { total_cost_usd: number }` — i.e. `string & number`, which is
 * `never`. That still compiles, and `never` silently satisfies every read at
 * the call site, so the bad type would surface only at runtime.
 */
export const selectLlmCostRows = async <
  TRow extends LlmCostDbRow & QueryResultRow,
>({
  fields,
  sort,
  table,
}: SelectLlmCostRowsArgs) => {
  const rows = await selectRows<TRow>({
    fields,
    schema: LLM_USAGE_SCHEMA,
    sort,
    table,
  });

  return rows.map(({ total_cost_usd, ...rest }) => ({
    ...rest,
    total_cost_usd: Number(total_cost_usd),
  }));
};
