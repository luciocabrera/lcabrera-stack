import type { RunFigures } from '../types/runFigures.types';

export const runWhenLabel = ({
  branch,
  startedAt,
}: Pick<RunFigures, 'branch' | 'startedAt'>) =>
  `${startedAt.slice(0, 16).replace('T', ' ')} on ${branch}`;
