import type { LabelledRun } from './report.types.ts';

import { SHORT_SHA_LENGTH } from './report.constants.ts';

export const runLabel = ({ branch, gitSha }: LabelledRun) =>
  `${branch}@${gitSha.slice(0, SHORT_SHA_LENGTH)}`;
