import { z } from 'zod';

const usdPerMtok = z.number().nonnegative().max(999_999);

const modelPriceSchema = z
  .strictObject({
    modelId: z.string().min(1),
    usdPerMtokCacheRead: usdPerMtok,
    usdPerMtokCacheWrite: usdPerMtok,
    usdPerMtokIn: usdPerMtok,
    usdPerMtokOut: usdPerMtok,
    validFrom: z.iso.date(),
  })
  .readonly();

const priceKey = ({ modelId, validFrom }: z.infer<typeof modelPriceSchema>) =>
  `${modelId}@${validFrom}`;

export const modelPricesSchema = z
  .strictObject({
    prices: z
      .array(modelPriceSchema)
      .min(1)
      .readonly()
      .refine(
        (prices) =>
          new Set(prices.map((price) => priceKey(price))).size ===
          prices.length,
        { message: 'each modelId and validFrom pair must appear once' },
      ),
    source: z.url({ protocol: /^https$/ }),
  })
  .readonly();
