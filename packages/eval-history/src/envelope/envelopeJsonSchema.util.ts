import { z } from 'zod';

import { runEnvelopeSchema } from './envelope.schema.ts';

export const envelopeJsonSchema = () =>
  z.toJSONSchema(runEnvelopeSchema, { io: 'input' });
