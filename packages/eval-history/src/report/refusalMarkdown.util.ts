import type { Refusal } from './report.types.ts';

import { refusalText } from './refusalText.util.ts';
import { sideLabels } from './sideLabels.util.ts';

export const refusalMarkdown = (refusal: Refusal) => {
  const labels = sideLabels(refusal);

  return `### ${refusal.suite}: ${labels.b} vs ${labels.a}: not compared\n\n${refusalText(refusal)}`;
};
