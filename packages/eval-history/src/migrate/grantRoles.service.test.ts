import { describe, expect, it } from 'vite-plus/test';

import type { EvalsRole, MigrationClient } from './migrate.types.ts';

import { grantRoles } from './grantRoles.service.ts';

const role = (name: string): EvalsRole => ({
  grants: [{ on: 'schema evals', privileges: 'usage' }],
  name,
});

type FakeArgs = {
  readonly existing: readonly string[];
  readonly failOn?: string;
};

const fakeClient = ({ existing, failOn }: FakeArgs) => {
  const statements: string[] = [];
  const client: MigrationClient = {
    query: async ({ text }) => {
      statements.push(text);

      if (text === failOn) {
        throw new Error(`failed: ${text}`);
      }

      return {
        rows: text.includes('pg_roles')
          ? existing.map((rolname) => ({ rolname }))
          : [],
      };
    },
  };

  return { client, statements };
};

describe('grantRoles', () => {
  it('grants the roles that exist and returns the ones that do not', async () => {
    const { client, statements } = fakeClient({ existing: ['present'] });
    const result = await grantRoles({
      client,
      roles: [role('present'), role('absent')],
    });

    expect(result).toEqual({
      granted: [role('present')],
      missing: [role('absent')],
    });
    expect(statements.slice(1)).toEqual([
      'begin',
      'grant usage on schema evals to "present";',
      'commit',
    ]);
  });

  it('sends every grant of every existing role as one statement batch', async () => {
    const { client, statements } = fakeClient({
      existing: ['first', 'second'],
    });

    await grantRoles({ client, roles: [role('first'), role('second')] });

    expect(statements.slice(1)).toEqual([
      'begin',
      'grant usage on schema evals to "first";\ngrant usage on schema evals to "second";',
      'commit',
    ]);
  });

  it('opens no transaction when no role exists', async () => {
    const { client, statements } = fakeClient({ existing: [] });
    const result = await grantRoles({ client, roles: [role('absent')] });

    expect(result).toEqual({ granted: [], missing: [role('absent')] });
    expect(statements).toHaveLength(1);
  });

  it('rolls back the grants when the batch fails', async () => {
    const failOn =
      'grant usage on schema evals to "first";\ngrant usage on schema evals to "second";';
    const { client, statements } = fakeClient({
      existing: ['first', 'second'],
      failOn,
    });

    await expect(
      grantRoles({ client, roles: [role('first'), role('second')] }),
    ).rejects.toThrow('failed: grant');
    expect(statements.at(-1)).toBe('rollback');
  });
});
