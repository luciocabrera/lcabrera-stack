import type { z } from 'zod';

import type { costFiguresSchema } from './costFigures.schema.ts';
import type { runJudgeScoreRowSchema } from './runJudgeScoreRow.schema.ts';
import type { runSummaryRowSchema } from './runSummaryRow.schema.ts';
import type { runTrialRowSchema } from './runTrialRow.schema.ts';
import type { subjectRunRowSchema } from './subjectRunRow.schema.ts';

export type CostFigures = z.output<typeof costFiguresSchema>;

export type QueryClient = {
  readonly query: (query: SqlQuery) => Promise<{
    readonly rows: readonly unknown[];
  }>;
};

export type RunJudgeScore = z.output<typeof runJudgeScoreRowSchema>;

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

export type SubjectRun = z.output<typeof subjectRunRowSchema>;

export type TrialSort = {
  readonly column: string;
  readonly direction: 'asc' | 'desc';
};
