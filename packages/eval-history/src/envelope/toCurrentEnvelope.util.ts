import type { EnvelopeUpcasters } from './envelope.types.ts';

import { parseEnvelope } from './parseEnvelope.util.ts';
import { upcastEnvelope } from './upcastEnvelope.util.ts';

type ToCurrentEnvelopeArgs = {
  readonly current?: number;
  readonly input: unknown;
  readonly upcasters?: EnvelopeUpcasters;
};

const fieldOf = (path: readonly PropertyKey[]) =>
  path.length === 0 ? '(root)' : path.map(String).join('.');

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
          ({ message, path }) => `${fieldOf(path)}: ${message}`,
        ),
      } as const);
};
