import path from 'node:path';

import { ADJUDICATION_FILE_PATTERN } from './ingest.constants.ts';

export const isAdjudicationFile = (file: string) =>
  ADJUDICATION_FILE_PATTERN.test(path.basename(file));
