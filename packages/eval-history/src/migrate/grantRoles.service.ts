import { z } from 'zod';

import type {
  EvalsRole,
  MigrationClient,
  UngrantedRole,
} from './migrate.types.ts';

import { inSequence } from '../ingest/inSequence.service.ts';
import { grantStatements } from './grantStatements.util.ts';
import { lackingPrivileges } from './lackingPrivileges.service.ts';
import { resolveGrants } from './resolveGrants.service.ts';
import { revokeStatements } from './revokeStatements.util.ts';

type ApplyGrantsArgs = {
  readonly client: MigrationClient;
  readonly roles: readonly ResolvedRole[];
};

type GrantRolesArgs = {
  readonly client: MigrationClient;
  readonly roles: readonly EvalsRole[];
};

type ResolvedRole = {
  readonly declared: EvalsRole;
  readonly resolved: EvalsRole;
};

const roleRowsSchema = z.array(z.object({ rolname: z.string() }));

const existingRoleNames = async ({ client, roles }: GrantRolesArgs) => {
  const { rows } = await client.query({
    text: 'select rolname from pg_roles where rolname = any($1::text[])',
    values: [roles.map(({ name }) => name)],
  });

  return new Set(roleRowsSchema.parse(rows).map(({ rolname }) => rolname));
};

const applyGrants = async ({ client, roles }: ApplyGrantsArgs) => {
  const statements = roles.flatMap(({ declared, resolved }) => [
    ...revokeStatements(declared),
    ...grantStatements(resolved),
  ]);

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
  const checked: readonly UngrantedRole[] = await inSequence({
    items: roles,
    step: async (role) => ({
      lacking: await lackingPrivileges({ client, role }),
      role,
    }),
  });

  return {
    granted: checked
      .filter(({ lacking }) => lacking.length === 0)
      .map(({ role }) => role),
    ungranted: checked.filter(({ lacking }) => lacking.length > 0),
  };
};

export const grantRoles = async ({ client, roles }: GrantRolesArgs) => {
  const existing = await existingRoleNames({ client, roles });
  const resolved: readonly ResolvedRole[] = await inSequence({
    items: roles,
    step: async (declared) => ({
      declared,
      resolved: await resolveGrants({ client, role: declared }),
    }),
  });
  const present = resolved.filter(({ declared }) =>
    existing.has(declared.name),
  );

  await applyGrants({ client, roles: present });

  return {
    ...(await checkGrants({
      client,
      roles: present.map((role) => role.resolved),
    })),
    missing: resolved
      .filter(({ declared }) => !existing.has(declared.name))
      .map((role) => role.resolved),
  };
};
