import type { MigrationDriftIssue } from './migrate.types.ts';

const REASON_TEXT = {
  changed: 'changed since it was applied',
  missing: 'was applied but its file is gone',
  'out-of-order': 'is numbered below a migration already applied',
} as const satisfies Record<MigrationDriftIssue['reason'], string>;

export class MigrationDriftError extends Error {
  readonly issues: readonly MigrationDriftIssue[];

  constructor(issues: readonly MigrationDriftIssue[]) {
    super(
      [
        'evals.schema_migration no longer matches the migration files; a fix is a new migration:',
        ...issues.map(({ name, reason }) => `  ${name} ${REASON_TEXT[reason]}`),
      ].join('\n'),
    );
    this.name = 'MigrationDriftError';
    this.issues = issues;
  }
}
