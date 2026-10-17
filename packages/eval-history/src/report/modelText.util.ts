import type { RunSide, SidePair } from './report.types.ts';

export const modelText = ({ a, b }: SidePair<Pick<RunSide, 'modelId'>>) => {
  const before = a.modelId ?? 'no model';
  const after = b.modelId ?? 'no model';

  return before === after ? before : `${before} → ${after}`;
};
