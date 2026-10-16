import { readFile } from 'node:fs/promises';
import { z } from 'zod';

import type { ReadText } from './files.types.ts';

type ReadJsonFileArgs<Schema extends z.ZodType> = {
  readonly describedAs: string;
  readonly file: string;
  readonly readText?: ReadText;
  readonly schema: Schema;
};

export const readJsonFile = async <Schema extends z.ZodType>({
  describedAs,
  file,
  readText = readFile,
  schema,
}: ReadJsonFileArgs<Schema>) => {
  const result = schema.safeParse(JSON.parse(await readText(file, 'utf8')));

  if (!result.success) {
    throw new Error(
      `${file} is not a valid ${describedAs}:\n${z.prettifyError(result.error)}`,
    );
  }

  return result.data;
};
