import type { HashEntry, ReportRun } from './report.types.ts';

import { isRecordedHash } from './isRecordedHash.util.ts';
import { RUN_HASH_KEYS } from './report.constants.ts';
import { sharedHash } from './sharedHash.util.ts';
import { subjectHashes } from './subjectHashes.util.ts';
import { taskHashes } from './taskHashes.util.ts';

export const runHashes = (run: ReportRun) => {
  const entries: readonly HashEntry[] = [
    [RUN_HASH_KEYS.model, run.modelId],
    [RUN_HASH_KEYS.harness, run.harnessVersion],
    [RUN_HASH_KEYS.catalog, run.catalogHash],
    [
      RUN_HASH_KEYS.judgePrompt,
      sharedHash(run.tasks.map(({ judgePromptHash }) => judgePromptHash)),
    ],
    [
      RUN_HASH_KEYS.agentPrompt,
      sharedHash(run.tasks.map(({ agentPromptHash }) => agentPromptHash)),
    ],
    ...subjectHashes(run),
    ...run.tasks.flatMap((task) => taskHashes(task)),
  ];

  return Object.fromEntries(entries.filter(isRecordedHash));
};
