import type { EnvelopeUpcasters } from './envelope.types.ts';

import { isPlainObject } from '../hashing/isPlainObject.util.ts';
import {
  ENVELOPE_SCHEMA_VERSION,
  ENVELOPE_UPCASTERS,
} from './envelope.constants.ts';

type UpcastEnvelopeArgs = {
  readonly current?: number;
  readonly input: unknown;
  readonly upcasters?: EnvelopeUpcasters;
};

const versionLabel = (version: unknown) =>
  version === undefined ? 'missing' : JSON.stringify(version);

export const upcastEnvelope = ({
  current = ENVELOPE_SCHEMA_VERSION,
  input,
  upcasters = ENVELOPE_UPCASTERS,
}: UpcastEnvelopeArgs) => {
  const envelope = isPlainObject(input) ? input : {};
  const version = envelope.schema_version;

  if (version === current) {
    return { input, ok: true } as const;
  }

  const previous = current - 1;
  const upcaster = upcasters[previous];

  if (version === previous && upcaster) {
    return { input: upcaster(envelope), ok: true } as const;
  }

  const supported = upcaster ? `${current} or ${previous}` : `${current}`;

  return {
    message: `schema_version ${versionLabel(version)} is not supported: this ingester reads version ${supported} (ADR-131)`,
    ok: false,
  } as const;
};
