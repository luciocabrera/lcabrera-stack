import type { z } from 'zod';

import type { modelPricesSchema } from './modelPrices.schema.ts';

export type ModelPrice = ModelPrices['prices'][number];

export type ModelPrices = z.infer<typeof modelPricesSchema>;
