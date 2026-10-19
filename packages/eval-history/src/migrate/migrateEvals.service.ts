import type { ModelPrice } from '../prices/prices.types.ts';
import type { EvalsRole, Migration, MigrationClient } from './migrate.types.ts';

import { upsertModelPrices } from '../prices/upsertModelPrices.service.ts';
import { applyMigrations } from './applyMigrations.service.ts';
import { declaresViewGrant } from './declaresViewGrant.util.ts';
import { exposedRoles } from './exposedRoles.service.ts';
import { grantRoles } from './grantRoles.service.ts';

type MigrateEvalsArgs = {
  readonly client: MigrationClient;
  readonly migrations: readonly Migration[];
  readonly prices: readonly ModelPrice[];
  readonly roles: readonly EvalsRole[];
};

export const migrateEvals = async ({
  client,
  migrations,
  prices,
  roles,
}: MigrateEvalsArgs) => {
  const applied = await applyMigrations({ client, migrations });
  const pricesUpserted = await upsertModelPrices({ client, prices });
  const { granted, missing, ungranted } = await grantRoles({ client, roles });
  const present = new Set(
    [...granted, ...ungranted.map(({ role }) => role)].map(({ name }) => name),
  );
  const exposed = await exposedRoles({
    client,
    roles: roles.filter(
      (role) => present.has(role.name) && declaresViewGrant(role),
    ),
  });
  const exposedNames = new Set(exposed.map(({ role }) => role.name));

  return {
    applied,
    exposed,
    granted: granted.filter(({ name }) => !exposedNames.has(name)),
    missing,
    pricesUpserted,
    ungranted,
  };
};
