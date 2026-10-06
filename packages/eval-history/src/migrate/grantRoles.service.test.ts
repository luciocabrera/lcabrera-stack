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
      'grant usage on schema evals to "present"',
      'commit',
    ]);
  });

  it('rolls back every grant when one fails', async () => {
    const failOn = 'grant usage on schema evals to "second"';
    const { client, statements } = fakeClient({
      existing: ['first', 'second'],
      failOn,
    });

    await expect(
      grantRoles({ client, roles: [role('first'), role('second')] }),
    ).rejects.toThrow(failOn);
    expect(statements.at(-1)).toBe('rollback');
  });
});
