import type { readFlakyTasks } from '@repo/eval-history/queries/readFlakyTasks.service';
import type { readTaskTrials } from '@repo/eval-history/queries/readTaskTrials.service';

export type FlakyTaskRow = Awaited<ReturnType<typeof readFlakyTasks>>[number];

export type TaskTrialsRow = Awaited<ReturnType<typeof readTaskTrials>>[number];
