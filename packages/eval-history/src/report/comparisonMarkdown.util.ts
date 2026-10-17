import type { Comparison } from './report.types.ts';

import { changedLine } from './changedLine.util.ts';
import { costText } from './costText.util.ts';
import { durationText } from './durationText.util.ts';
import { flipTable } from './flipTable.util.ts';
import { modelText } from './modelText.util.ts';
import { rateLine } from './rateLine.util.ts';
import { sideLabels } from './sideLabels.util.ts';
import { statusLines } from './statusLines.util.ts';

export const comparisonMarkdown = (comparison: Comparison) => {
  const labels = sideLabels(comparison);

  return [
    `### ${comparison.suite}: ${labels.a} → ${labels.b} (${modelText(comparison)})`,
    flipTable({ flips: comparison.flips, labels }),
    rateLine(comparison),
    `Cost: ${costText(comparison.a)} → ${costText(comparison.b)}. Duration p50: ${durationText(comparison.a)} → ${durationText(comparison.b)}.`,
    changedLine(comparison.changed),
    ...statusLines({ comparison, labels }),
  ].join('\n\n');
};
