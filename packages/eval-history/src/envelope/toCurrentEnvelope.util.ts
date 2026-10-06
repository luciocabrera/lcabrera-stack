import type { EnvelopeUpcasters } from './envelope.types.ts';

import { issueField } from './issueField.util.ts';
import { parseEnvelope } from './parseEnvelope.util.ts';
import { upcastEnvelope } from './upcastEnvelope.util.ts';

type ToCurrentEnvelopeArgs = {
  readonly current?: number;
  readonly input: unknown;
  readonly upcasters?: EnvelopeUpcasters;
};

export const toCurrentEnvelope = (args: ToCurrentEnvelopeArgs) => {
  const upcast = upcastEnvelope(args);

  if (!upcast.ok) {
    return { ok: false, problems: [upcast.message] } as const;
  }

  const parsed = parseEnvelope(upcast.input);

  return parsed.ok
    ? parsed
    : ({
        ok: false,
        problems: parsed.issues.map(
          ({ message, path }) => `${issueField(path)}: ${message}`,
        ),
      } as const);
};
