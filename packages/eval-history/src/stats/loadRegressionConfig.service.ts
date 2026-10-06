import { readFile } from 'node:fs/promises';
import { z } from 'zod';

import { regressionConfigSchema } from './regressionConfig.schema.ts';

type LoadRegressionConfigArgs = {
  readonly file: string;
  readonly readText?: ReadText;
};

type ReadText = (file: string, encoding: 'utf8') => Promise<string>;

export const loadRegressionConfig = async ({
  file,
  readText = readFile,
}: LoadRegressionConfigArgs) => {
  const result = regressionConfigSchema.safeParse(
    JSON.parse(await readText(file, 'utf8')),
  );

  if (!result.success) {
    throw new Error(
      `${file} is not a valid regression config:\n${z.prettifyError(result.error)}`,
    );
  }

  return result.data;
};
