import type { ReadText } from '../files/readJsonFile.service.ts';

import { readJsonFile } from '../files/readJsonFile.service.ts';
import { regressionConfigSchema } from './regressionConfig.schema.ts';

type LoadRegressionConfigArgs = {
  readonly file: string;
  readonly readText?: ReadText;
};

export const loadRegressionConfig = async ({
  file,
  readText,
}: LoadRegressionConfigArgs) =>
  readJsonFile({
    describedAs: 'regression config',
    file,
    readText,
    schema: regressionConfigSchema,
  });
