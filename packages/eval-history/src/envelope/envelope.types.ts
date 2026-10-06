import type { z } from 'zod';

import type {
  envelopeShapeSchema,
  runEnvelopeSchema,
  trialDetailSchema,
} from './envelope.schema.ts';

export type EnvelopeShape = DeepReadonly<z.output<typeof envelopeShapeSchema>>;

export type RunEnvelope = DeepReadonly<z.output<typeof runEnvelopeSchema>>;

export type TrialDetail = DeepReadonly<z.output<typeof trialDetailSchema>>;

type DeepReadonly<T> = T extends readonly (infer Item)[]
  ? readonly DeepReadonly<Item>[]
  : T extends object
    ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
    : T;
