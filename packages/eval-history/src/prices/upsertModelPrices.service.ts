import type { MigrationClient } from '../migrate/migrate.types.ts';
import type { ModelPrice } from './prices.types.ts';

type UpsertModelPricesArgs = {
  readonly client: MigrationClient;
  readonly prices: readonly ModelPrice[];
};

const UPSERT_SQL = `
insert into evals.model_price (
  model_id,
  valid_from,
  usd_per_mtok_in,
  usd_per_mtok_out,
  usd_per_mtok_cache_read,
  usd_per_mtok_cache_write
)
select model_id, valid_from::timestamp at time zone 'UTC', usd_in, usd_out, usd_cache_read, usd_cache_write
from unnest($1::text[], $2::date[], $3::numeric[], $4::numeric[], $5::numeric[], $6::numeric[])
  as price (model_id, valid_from, usd_in, usd_out, usd_cache_read, usd_cache_write)
on conflict (model_id, valid_from) do update set
  usd_per_mtok_in = excluded.usd_per_mtok_in,
  usd_per_mtok_out = excluded.usd_per_mtok_out,
  usd_per_mtok_cache_read = excluded.usd_per_mtok_cache_read,
  usd_per_mtok_cache_write = excluded.usd_per_mtok_cache_write
`;

export const upsertModelPrices = async ({
  client,
  prices,
}: UpsertModelPricesArgs) => {
  await client.query({
    text: UPSERT_SQL,
    values: [
      prices.map(({ modelId }) => modelId),
      prices.map(({ validFrom }) => validFrom),
      prices.map(({ usdPerMtokIn }) => String(usdPerMtokIn)),
      prices.map(({ usdPerMtokOut }) => String(usdPerMtokOut)),
      prices.map(({ usdPerMtokCacheRead }) => String(usdPerMtokCacheRead)),
      prices.map(({ usdPerMtokCacheWrite }) => String(usdPerMtokCacheWrite)),
    ],
  });

  return prices.length;
};
