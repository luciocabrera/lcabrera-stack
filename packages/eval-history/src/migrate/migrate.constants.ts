import type { EvalsRole } from './migrate.types.ts';

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

export const EVALS_WRITER_ROLE = {
  grants: [
    { on: 'schema evals', privileges: 'usage, create' },
    {
      on: 'all tables in schema evals',
      privileges: 'select, insert, update, delete',
    },
  ],
  name: 'evals_writer',
} as const satisfies EvalsRole;

export const EVALS_READER_ROLE = {
  grants: [
    { on: 'schema evals', privileges: 'usage' },
    { on: 'all tables in schema evals', privileges: 'select' },
  ],
  name: 'evals_reader',
} as const satisfies EvalsRole;

export const EVALS_ROLES: readonly EvalsRole[] = [
  EVALS_WRITER_ROLE,
  EVALS_READER_ROLE,
];
