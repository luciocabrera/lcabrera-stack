import type { EnvelopeUpcasters } from '../envelope/envelope.types.ts';

import { toCurrentEnvelope } from '../envelope/toCurrentEnvelope.util.ts';
import { readEnvelopeJson } from './readEnvelopeJson.service.ts';

type ReadEnvelopeFileArgs = {
  readonly file: string;
  readonly readBytes?: (file: string) => Promise<Uint8Array>;
  readonly upcasters?: EnvelopeUpcasters;
};

export const readEnvelopeFile = ({
  upcasters,
  ...args
}: ReadEnvelopeFileArgs) =>
  readEnvelopeJson({
    ...args,
    parse: (input) => toCurrentEnvelope({ input, upcasters }),
  });
