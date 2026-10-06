import type { ModelPrice } from '../prices/prices.types.ts';
import type { EvalsRole, Migration, MigrationClient } from './migrate.types.ts';

import { upsertModelPrices } from '../prices/upsertModelPrices.service.ts';
import { applyMigrations } from './applyMigrations.service.ts';
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
  const { granted, missing } = await grantRoles({ client, roles });

  return { applied, granted, missing, pricesUpserted };
};
