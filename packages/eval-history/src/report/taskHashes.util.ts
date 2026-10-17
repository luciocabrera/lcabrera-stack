import type { HashEntry, ReportTask } from './report.types.ts';

import { SCOPED_HASH_PREFIXES } from './report.constants.ts';

export const taskHashes = ({
  expectedHash,
  fixtureHash,
  taskHash,
  taskKey,
}: ReportTask): readonly HashEntry[] => [
  [`${SCOPED_HASH_PREFIXES.task}${taskKey}`, taskHash],
  [`${SCOPED_HASH_PREFIXES.fixture}${taskKey}`, fixtureHash],
  [`${SCOPED_HASH_PREFIXES.expected}${taskKey}`, expectedHash],
];
