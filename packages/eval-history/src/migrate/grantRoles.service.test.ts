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
  readonly lacking?: readonly string[];
};

const isLackingQuery = (text: string) => text.includes('has_schema_privilege');

const fakeClient = ({ existing, failOn, lacking = [] }: FakeArgs) => {
  const statements: string[] = [];
  const client: MigrationClient = {
    query: async ({ text, values }) => {
      statements.push(text);

      if (text === failOn) {
        throw new Error(`failed: ${text}`);
      }

      if (text.includes('pg_roles')) {
        return { rows: existing.map((rolname) => ({ rolname })) };
      }

      const lacks =
        isLackingQuery(text) && lacking.includes(String(values?.[0]));

      return {
        rows: lacks ? [{ object: 'schema evals', privilege: 'usage' }] : [],
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
      ungranted: [],
    });
    expect(statements.slice(1, 4)).toEqual([
      'begin',
      'grant usage on schema evals to "present";',
      'commit',
    ]);
  });

  it('sends every grant as one batch, then checks each role after the commit', async () => {
    const { client, statements } = fakeClient({
      existing: ['first', 'second'],
    });

    await grantRoles({ client, roles: [role('first'), role('second')] });

    expect(statements.slice(1, 4)).toEqual([
      'begin',
      'grant usage on schema evals to "first";\ngrant usage on schema evals to "second";',
      'commit',
    ]);
    expect(statements.slice(4)).toHaveLength(2);
    expect(statements.slice(4).every((text) => isLackingQuery(text))).toBe(
      true,
    );
  });

  it('reports a role that still lacks a privilege instead of granted', async () => {
    const { client } = fakeClient({
      existing: ['held', 'unheld'],
      lacking: ['unheld'],
    });
    const result = await grantRoles({
      client,
      roles: [role('held'), role('unheld')],
    });

    expect(result).toEqual({
      granted: [role('held')],
      missing: [],
      ungranted: [
        {
          lacking: [{ object: 'schema evals', privilege: 'usage' }],
          role: role('unheld'),
        },
      ],
    });
  });

  it('opens no transaction when no role exists', async () => {
    const { client, statements } = fakeClient({ existing: [] });
    const result = await grantRoles({ client, roles: [role('absent')] });

    expect(result).toEqual({
      granted: [],
      missing: [role('absent')],
      ungranted: [],
    });
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
