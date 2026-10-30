import type { z } from 'zod';

import type {
  adjudicationEnvelopeSchema,
  adjudicationShapeSchema,
} from './adjudicationEnvelope.schema.ts';
import type {
  envelopeShapeSchema,
  runEnvelopeSchema,
  trialDetailSchema,
} from './envelope.schema.ts';

export type AdjudicationEnvelope = DeepReadonly<
  z.output<typeof adjudicationEnvelopeSchema>
>;

export type AdjudicationShape = DeepReadonly<
  z.output<typeof adjudicationShapeSchema>
>;

export type EnvelopeShape = DeepReadonly<z.output<typeof envelopeShapeSchema>>;

export type EnvelopeUpcaster = (
  envelope: Readonly<Record<string, unknown>>,
) => unknown;

export type EnvelopeUpcasters = Readonly<
  Partial<Record<number, EnvelopeUpcaster>>
>;

export type RunEnvelope = DeepReadonly<z.output<typeof runEnvelopeSchema>>;

export type TrialDetail = DeepReadonly<z.output<typeof trialDetailSchema>>;

type DeepReadonly<T> = T extends readonly (infer Item)[]
  ? readonly DeepReadonly<Item>[]
  : T extends object
    ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
    : T;
