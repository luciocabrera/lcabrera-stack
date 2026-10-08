import type { ReportRun, ReportTask } from './report.types.ts';

import { compareCodeUnits } from '../hashing/compareCodeUnits.util.ts';
import { RUN_HASH_KEYS, SCOPED_HASH_PREFIXES } from './report.constants.ts';

type HashEntry = readonly [string, string | undefined];

const isRecorded = (entry: HashEntry): entry is readonly [string, string] =>
  entry[1] !== undefined;

const sharedHash = (values: readonly (string | undefined)[]) => {
  const distinct = [
    ...new Set(values.filter((value) => value !== undefined)),
  ].toSorted(compareCodeUnits);

  return distinct.length === 0 ? undefined : distinct.join(',');
};

const taskHashes = ({
  expectedHash,
  fixtureHash,
  taskHash,
  taskKey,
}: ReportTask): readonly HashEntry[] => [
  [`${SCOPED_HASH_PREFIXES.task}${taskKey}`, taskHash],
  [`${SCOPED_HASH_PREFIXES.fixture}${taskKey}`, fixtureHash],
  [`${SCOPED_HASH_PREFIXES.expected}${taskKey}`, expectedHash],
];

const subjectHashes = ({ subjects }: ReportRun) =>
  subjects.map(({ contentHash, kind, name }): HashEntry => [
    `${SCOPED_HASH_PREFIXES.content}${kind}/${name}`,
    contentHash,
  ]);

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

  return Object.fromEntries(entries.filter(isRecorded));
};
