import { z } from 'zod';

import type {
  EvalsRole,
  MigrationClient,
  UngrantedRole,
} from './migrate.types.ts';

import { grantStatements } from './grantStatements.util.ts';
import { lackingPrivileges } from './lackingPrivileges.service.ts';

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

  if (statements.length === 0) {
    return;
  }

  await client.query({ text: 'begin' });

  try {
    await client.query({
      text: statements.map((statement) => `${statement};`).join('\n'),
    });
    await client.query({ text: 'commit' });
  } catch (error) {
    await client.query({ text: 'rollback' });
    throw error;
  }
};

const checkGrants = async ({ client, roles }: GrantRolesArgs) => {
  const checked: UngrantedRole[] = [];

  for (const role of roles) {
    checked.push({ lacking: await lackingPrivileges({ client, role }), role });
  }

  return {
    granted: checked
      .filter(({ lacking }) => lacking.length === 0)
      .map(({ role }) => role),
    ungranted: checked.filter(({ lacking }) => lacking.length > 0),
  };
};

export const grantRoles = async ({ client, roles }: GrantRolesArgs) => {
  const existing = await existingRoleNames({ client, roles });
  const present = roles.filter(({ name }) => existing.has(name));

  await applyGrants({ client, roles: present });

  return {
    ...(await checkGrants({ client, roles: present })),
    missing: roles.filter(({ name }) => !existing.has(name)),
  };
};
