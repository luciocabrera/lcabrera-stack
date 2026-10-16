import type { z } from 'zod';

import type { runSummaryRowSchema } from './runSummaryRow.schema.ts';
import type { runTrialRowSchema } from './runTrialRow.schema.ts';

export type QueryClient = {
  readonly query: (query: SqlQuery) => Promise<{
    readonly rows: readonly unknown[];
  }>;
};

export type RunSummary = z.output<typeof runSummaryRowSchema>;

export type RunTrial = z.output<typeof runTrialRowSchema>;

export type SchemaColumn = {
  readonly column: string;
  readonly dataType: string;
  readonly table: string;
  readonly udtName: string;
};

export type SqlQuery = {
  readonly text: string;
  readonly values: unknown[];
};

export type TrialSort = {
  readonly column: string;
  readonly direction: 'asc' | 'desc';
};
