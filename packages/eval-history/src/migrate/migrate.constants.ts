export const MIGRATION_FILE_PATTERN = /^(\d{4})-[a-z\d][a-z\d-]*\.sql$/;

export const MIGRATION_LOCK_KEY = 1_268_726_576;

export const MIGRATIONS_DIRECTORY = new URL(
  '../../migrations/',
  import.meta.url,
);

export const BOOTSTRAP_SQL = `
create schema if not exists evals;
create table if not exists evals.schema_migration (
  version integer primary key,
  name text not null unique,
  sha256 char(64) not null,
  applied_at timestamptz not null default now()
);
`;
