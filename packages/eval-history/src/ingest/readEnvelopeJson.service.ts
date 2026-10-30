import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import { errorReason } from './errorReason.util.ts';

type Parsed<Envelope> =
  | { readonly envelope: Envelope; readonly ok: true }
  | { readonly ok: false; readonly problems: readonly string[] };

type ReadBytesArgs = {
  readonly file: string;
  readonly readBytes?: (file: string) => Promise<Uint8Array>;
};

type ReadEnvelopeJsonArgs<Envelope> = ReadBytesArgs & {
  readonly parse: (json: unknown) => Parsed<Envelope>;
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

const readOrReason = async ({ file, readBytes }: Required<ReadBytesArgs>) => {
  try {
    return { bytes: await readBytes(file), ok: true } as const;
  } catch (error) {
    return { ok: false, reason: errorReason(error) } as const;
  }
};

export const readEnvelopeJson = async <Envelope>({
  file,
  parse,
  readBytes = readFile,
}: ReadEnvelopeJsonArgs<Envelope>) => {
  const read = await readOrReason({ file, readBytes });

  if (!read.ok) {
    return {
      file,
      ok: false,
      problems: [`could not read: ${read.reason}`],
    } as const;
  }

  const json = parseJson(new TextDecoder().decode(read.bytes));

  if (!json.ok) {
    return { file, ok: false, problems: [json.message] } as const;
  }

  const parsed = parse(json.value);

  return parsed.ok
    ? ({
        envelope: parsed.envelope,
        file,
        ok: true,
        sha256: createHash('sha256').update(read.bytes).digest('hex'),
      } as const)
    : ({ file, ok: false, problems: parsed.problems } as const);
};
