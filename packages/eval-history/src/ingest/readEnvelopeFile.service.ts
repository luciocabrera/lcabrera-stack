import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import type { EnvelopeUpcasters } from '../envelope/envelope.types.ts';

import { toCurrentEnvelope } from '../envelope/toCurrentEnvelope.util.ts';

type ReadEnvelopeFileArgs = {
  readonly file: string;
  readonly readBytes?: (file: string) => Promise<Uint8Array>;
  readonly upcasters?: EnvelopeUpcasters;
};

const parseJson = (text: string) => {
  try {
    return { ok: true, value: JSON.parse(text) as unknown } as const;
  } catch (error) {
    return {
      message: `not JSON: ${error instanceof Error ? error.message : String(error)}`,
      ok: false,
    } as const;
  }
};

export const readEnvelopeFile = async ({
  file,
  readBytes = readFile,
  upcasters,
}: ReadEnvelopeFileArgs) => {
  const bytes = await readBytes(file);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const json = parseJson(new TextDecoder().decode(bytes));

  if (!json.ok) {
    return { file, ok: false, problems: [json.message] } as const;
  }

  const parsed = toCurrentEnvelope({ input: json.value, upcasters });

  return parsed.ok
    ? ({ envelope: parsed.envelope, file, ok: true, sha256 } as const)
    : ({ file, ok: false, problems: parsed.problems } as const);
};
