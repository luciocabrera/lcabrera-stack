export type AppliedMigration = Omit<Migration, 'sql'>;

export type Migration = {
  readonly name: string;
  readonly sha256: string;
  readonly sql: string;
  readonly version: number;
};

export type MigrationClient = {
  readonly query: (config: MigrationQuery) => Promise<{
    readonly rows: readonly unknown[];
  }>;
};

export type MigrationDriftIssue = {
  readonly name: string;
  readonly reason: 'changed' | 'missing' | 'out-of-order';
};

export type MigrationQuery = {
  readonly text: string;
  readonly values?: unknown[];
};
