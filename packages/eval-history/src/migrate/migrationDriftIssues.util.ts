import type {
  AppliedMigration,
  Migration,
  MigrationDriftIssue,
} from './migrate.types.ts';

type MigrationDriftIssuesArgs = {
  readonly applied: readonly AppliedMigration[];
  readonly migrations: readonly Migration[];
};

export const migrationDriftIssues = ({
  applied,
  migrations,
}: MigrationDriftIssuesArgs) => {
  const fileByVersion = new Map(
    migrations.map((migration) => [migration.version, migration]),
  );
  const appliedVersions = new Set(applied.map(({ version }) => version));
  const highestApplied = Math.max(0, ...appliedVersions);

  const appliedIssues = applied
    .filter((row) => fileByVersion.get(row.version)?.sha256 !== row.sha256)
    .map((row): MigrationDriftIssue => ({
      name: row.name,
      reason: fileByVersion.has(row.version) ? 'changed' : 'missing',
    }));
  const pendingIssues = migrations
    .filter(
      ({ version }) =>
        !appliedVersions.has(version) && version < highestApplied,
    )
    .map(({ name }): MigrationDriftIssue => ({ name, reason: 'out-of-order' }));

  return [...appliedIssues, ...pendingIssues];
};
