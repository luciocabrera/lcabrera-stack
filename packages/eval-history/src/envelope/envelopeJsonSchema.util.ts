import { z } from 'zod';

import { runEnvelopeSchema } from './envelope.schema.ts';

export const envelopeJsonSchema = (
  schema: z.core.$ZodType = runEnvelopeSchema,
) => z.toJSONSchema(schema, { io: 'input' });
