import type { RunEnvelope } from './envelope.types.ts';

import { runEnvelopeSchema } from './envelope.schema.ts';

export const parseEnvelope = (input: unknown) => {
  const result = runEnvelopeSchema.safeParse(input);

  if (!result.success) {
    return { issues: result.error.issues, ok: false } as const;
  }

  const envelope: RunEnvelope = result.data;

  return { envelope, ok: true } as const;
};
