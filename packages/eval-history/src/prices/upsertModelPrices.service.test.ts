import { describe, expect, it } from 'vite-plus/test';

import type { MigrationQuery } from '../migrate/migrate.types.ts';

import { upsertModelPrices } from './upsertModelPrices.service.ts';

describe('upsertModelPrices', () => {
  it('upserts every price in one statement, column by column', async () => {
    const queries: MigrationQuery[] = [];
    const count = await upsertModelPrices({
      client: {
        query: async (query) => {
          queries.push(query);

          return { rows: [] };
        },
      },
      prices: [
        {
          modelId: 'model-a',
          usdPerMtokCacheRead: 0.2,
          usdPerMtokCacheWrite: 2.5,
          usdPerMtokIn: 2,
          usdPerMtokOut: 10,
          validFrom: '2026-01-01',
        },
        {
          modelId: 'model-b',
          usdPerMtokCacheRead: 0.5,
          usdPerMtokCacheWrite: 6.25,
          usdPerMtokIn: 5,
          usdPerMtokOut: 25,
          validFrom: '2026-02-01',
        },
      ],
    });

    expect(count).toBe(2);
    expect(queries).toHaveLength(1);
    expect(queries[0]?.text).toMatch(
      /on conflict \(model_id, valid_from\) do update/,
    );
    expect(queries[0]?.values).toEqual([
      ['model-a', 'model-b'],
      ['2026-01-01', '2026-02-01'],
      ['2', '5'],
      ['10', '25'],
      ['0.2', '0.5'],
      ['2.5', '6.25'],
    ]);
  });
});
