import type { EnvelopeUpcasters } from '../envelope/envelope.types.ts';

import { toCurrentAdjudication } from '../envelope/toCurrentAdjudication.util.ts';
import { readEnvelopeJson } from './readEnvelopeJson.service.ts';

type ReadAdjudicationFileArgs = {
  readonly file: string;
  readonly readBytes?: (file: string) => Promise<Uint8Array>;
  readonly upcasters?: EnvelopeUpcasters;
};

export const readAdjudicationFile = ({
  upcasters,
  ...args
}: ReadAdjudicationFileArgs) =>
  readEnvelopeJson({
    ...args,
    parse: (input) => toCurrentAdjudication({ input, upcasters }),
  });
