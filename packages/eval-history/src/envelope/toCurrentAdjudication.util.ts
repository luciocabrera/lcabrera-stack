import type {
  AdjudicationEnvelope,
  EnvelopeUpcasters,
} from './envelope.types.ts';

import { adjudicationEnvelopeSchema } from './adjudicationEnvelope.schema.ts';
import {
  ADJUDICATION_SCHEMA_VERSION,
  ADJUDICATION_UPCASTERS,
} from './envelope.constants.ts';
import { issueField } from './issueField.util.ts';
import { upcastEnvelope } from './upcastEnvelope.util.ts';

type ToCurrentAdjudicationArgs = {
  readonly current?: number;
  readonly input: unknown;
  readonly upcasters?: EnvelopeUpcasters;
};

export const toCurrentAdjudication = ({
  current = ADJUDICATION_SCHEMA_VERSION,
  input,
  upcasters = ADJUDICATION_UPCASTERS,
}: ToCurrentAdjudicationArgs) => {
  const upcast = upcastEnvelope({ current, input, upcasters });

  if (!upcast.ok) {
    return { ok: false, problems: [upcast.message] } as const;
  }

  const result = adjudicationEnvelopeSchema.safeParse(upcast.input);

  if (!result.success) {
    return {
      ok: false,
      problems: result.error.issues.map(
        ({ message, path }) => `${issueField(path)}: ${message}`,
      ),
    } as const;
  }

  const envelope: AdjudicationEnvelope = result.data;

  return { envelope, ok: true } as const;
};
