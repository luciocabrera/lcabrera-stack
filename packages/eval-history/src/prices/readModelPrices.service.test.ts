import { describe, expect, it } from 'vite-plus/test';

import type { ModelPrice } from './prices.types.ts';

import { readModelPrices } from './readModelPrices.service.ts';

const price: ModelPrice = {
  modelId: 'model-a',
  usdPerMtokCacheRead: 0.1,
  usdPerMtokCacheWrite: 1.25,
  usdPerMtokIn: 1,
  usdPerMtokOut: 5,
  validFrom: '2026-01-01',
};

const readWith = (file: unknown) =>
  readModelPrices({
    file: 'model-prices.json',
    readText: async () => JSON.stringify(file),
  });

const valid = (prices: readonly unknown[]) => ({
  prices,
  source: 'https://example.com/pricing',
});

describe('readModelPrices', () => {
  it('reads the committed price list', async () => {
    const prices = await readModelPrices();

    expect(prices.length).toBeGreaterThan(0);
    expect(
      new Set(prices.map(({ modelId, validFrom }) => `${modelId}@${validFrom}`))
        .size,
    ).toBe(prices.length);
  });

  it('returns the prices of a valid file', async () => {
    expect(await readWith(valid([price]))).toEqual([price]);
  });

  it.each([
    { file: valid([]), label: 'an empty list' },
    {
      file: valid([{ ...price, usdPerMtokIn: -1 }]),
      label: 'a negative price',
    },
    {
      file: valid([{ ...price, usdPerMtokBatch: 1 }]),
      label: 'an unknown key',
    },
    {
      file: valid([{ ...price, usdPerMtokOut: undefined }]),
      label: 'a missing price',
    },
    {
      file: valid([{ ...price, validFrom: '2026-01-01T00:00:00Z' }]),
      label: 'a timestamp for validFrom',
    },
    {
      file: valid([price, { ...price, usdPerMtokIn: 2 }]),
      label: 'a repeated model and date',
    },
    {
      file: { prices: [price], source: 'http://example.com' },
      label: 'a non-https source',
    },
  ])('rejects $label and names the file', async ({ file }) => {
    await expect(readWith(file)).rejects.toThrow(
      /model-prices\.json is not a valid model price list/,
    );
  });

  it('accepts the same model at two dates', async () => {
    const later = { ...price, usdPerMtokIn: 2, validFrom: '2026-06-01' };

    expect(await readWith(valid([price, later]))).toEqual([price, later]);
  });
});
