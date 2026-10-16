import { fileURLToPath } from 'node:url';

import type { ReadText } from '../files/files.types.ts';

import { readJsonFile } from '../files/readJsonFile.service.ts';
import { modelPricesSchema } from './modelPrices.schema.ts';
import { MODEL_PRICES_FILE } from './prices.constants.ts';

type ReadModelPricesArgs = {
  readonly file?: string;
  readonly readText?: ReadText;
};

export const readModelPrices = async ({
  file = fileURLToPath(MODEL_PRICES_FILE),
  readText,
}: ReadModelPricesArgs = {}) => {
  const { prices } = await readJsonFile({
    describedAs: 'model price list',
    file,
    readText,
    schema: modelPricesSchema,
  });

  return prices;
};
