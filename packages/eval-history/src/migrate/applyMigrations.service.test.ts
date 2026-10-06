import { describe, expect, it } from 'vite-plus/test';

import type { AppliedMigration, MigrationClient } from './migrate.types.ts';

import { applyMigrations } from './applyMigrations.service.ts';
import { MigrationDriftError } from './migrationDrift.error.ts';

type MigrationArgs = {
  readonly sha256: string;
  readonly version: number;
};

const migration = ({ sha256, version }: MigrationArgs) => ({
  name: `000${String(version)}-m.sql`,
  sha256,
  sql: `-- migration ${String(version)}`,
  version,
});

type FakeArgs = {
  readonly applied?: readonly AppliedMigration[];
  readonly failOn?: string;
};

const fakeClient = ({ applied = [], failOn }: FakeArgs = {}) => {
  const statements: string[] = [];
  const rows = [...applied];
  const client: MigrationClient = {
    query: async ({ text, values }) => {
      statements.push(text);

      if (text === failOn) {
        throw new Error(`failed: ${text}`);
      }

      if (text.startsWith('insert into evals.schema_migration')) {
        const [version, name, sha256] = values ?? [];

        rows.push({
          name: String(name),
          sha256: String(sha256),
          version: Number(version),
        });
      }

      return { rows: text.startsWith('select version') ? [...rows] : [] };
    },
  };

  return { client, rows, statements };
};

describe('applyMigrations', () => {
  it('applies each pending file in its own locked transaction', async () => {
    const { client, rows, statements } = fakeClient();
    const migrations = [
      migration({ sha256: 'a', version: 1 }),
      migration({ sha256: 'b', version: 2 }),
    ];

    const applied = await applyMigrations({ client, migrations });

    expect(applied).toEqual(migrations);
    expect(rows.map(({ name }) => name)).toEqual(['0001-m.sql', '0002-m.sql']);
    expect(statements.filter((text) => text === 'begin')).toHaveLength(3);
    expect(
      statements.filter((text) => text.includes('pg_advisory_xact_lock')),
    ).toHaveLength(3);
    expect(statements.filter((text) => text === 'commit')).toHaveLength(3);
  });

  it('applies nothing when every file is already recorded', async () => {
    const { client, statements } = fakeClient({
      applied: [{ name: '0001-m.sql', sha256: 'a', version: 1 }],
    });

    expect(
      await applyMigrations({
        client,
        migrations: [migration({ sha256: 'a', version: 1 })],
      }),
    ).toEqual([]);
    expect(statements).not.toContain('-- migration 1');
  });

  it('rolls back and names the file when an applied one changed', async () => {
    const { client, statements } = fakeClient({
      applied: [{ name: '0001-m.sql', sha256: 'a', version: 1 }],
    });

    await expect(
      applyMigrations({
        client,
        migrations: [
          migration({ sha256: 'edited', version: 1 }),
          migration({ sha256: 'b', version: 2 }),
        ],
      }),
    ).rejects.toThrow(MigrationDriftError);
    expect(statements.at(-1)).toBe('rollback');
    expect(statements).not.toContain('-- migration 2');
  });

  it('rolls back a migration that fails and records nothing for it', async () => {
    const { client, rows, statements } = fakeClient({
      failOn: '-- migration 2',
    });

    await expect(
      applyMigrations({
        client,
        migrations: [
          migration({ sha256: 'a', version: 1 }),
          migration({ sha256: 'b', version: 2 }),
        ],
      }),
    ).rejects.toThrow('failed: -- migration 2');
    expect(statements.at(-1)).toBe('rollback');
    expect(rows.map(({ name }) => name)).toEqual(['0001-m.sql']);
  });
});
