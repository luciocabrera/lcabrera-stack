import { z } from 'zod';

import type { EvalsRole, MigrationClient } from './migrate.types.ts';

import { grantStatements } from './roleStatements.util.ts';

type GrantRolesArgs = {
  readonly client: MigrationClient;
  readonly roles: readonly EvalsRole[];
};

const roleRowsSchema = z.array(z.object({ rolname: z.string() }));

const existingRoleNames = async ({ client, roles }: GrantRolesArgs) => {
  const { rows } = await client.query({
    text: 'select rolname from pg_roles where rolname = any($1::text[])',
    values: [roles.map(({ name }) => name)],
  });

  return new Set(roleRowsSchema.parse(rows).map(({ rolname }) => rolname));
};

const applyGrants = async ({ client, roles }: GrantRolesArgs) => {
  const statements = roles.flatMap((role) => grantStatements(role));

  await client.query({ text: 'begin' });

  try {
    for (const statement of statements) {
      await client.query({ text: statement });
    }

    await client.query({ text: 'commit' });
  } catch (error) {
    await client.query({ text: 'rollback' });
    throw error;
  }
};

export const grantRoles = async ({ client, roles }: GrantRolesArgs) => {
  const existing = await existingRoleNames({ client, roles });
  const granted = roles.filter(({ name }) => existing.has(name));

  await applyGrants({ client, roles: granted });

  return {
    granted,
    missing: roles.filter(({ name }) => !existing.has(name)),
  };
};
