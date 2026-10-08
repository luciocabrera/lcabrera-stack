import type { RunComparison, RunSide } from './report.types.ts';

import { changedLine } from './changedLine.util.ts';
import { flipTable } from './flipTable.util.ts';
import { rateText } from './rateText.util.ts';
import { sideLabels } from './sideLabels.util.ts';

type Comparison = Extract<RunComparison, { readonly kind: 'comparison' }>;

const modelText = ({ a, b }: Pick<Comparison, 'a' | 'b'>) => {
  const before = a.modelId ?? 'no model';
  const after = b.modelId ?? 'no model';

  return before === after ? before : `${before} → ${after}`;
};

const costText = ({ costUsdReported }: RunSide) =>
  costUsdReported === undefined
    ? 'not reported'
    : `$${costUsdReported.toFixed(2)}`;

const durationText = ({ durationP50Ms }: RunSide) =>
  durationP50Ms === undefined
    ? 'not recorded'
    : `${(durationP50Ms / 1000).toFixed(1)} s`;

const rateLine = ({ a, b, thresholds }: Comparison) => {
  const line = `Pass rate, Wilson interval at z=${String(thresholds.z)}: ${rateText(a)} → ${rateText(b)}.`;
  const isShort =
    a.rate.kind === 'insufficient' || b.rate.kind === 'insufficient';

  return isShort
    ? `${line} A rate needs ${String(thresholds.minTrialsForRate)} counted trials; error, timeout and skipped trials are not counted.`
    : line;
};

type StatusLinesArgs = {
  readonly comparison: Comparison;
  readonly labels: ReturnType<typeof sideLabels>;
};

const statusLines = ({ comparison: { a, b }, labels }: StatusLinesArgs) =>
  [
    { label: labels.a, side: a },
    { label: labels.b, side: b },
  ]
    .filter(({ side }) => side.status !== 'complete')
    .map(
      ({ label, side }) =>
        `${label} is ${side.status === 'partial' ? 'a partial' : 'an aborted'} run, so it holds only the trials that finished.`,
    );

export const comparisonMarkdown = (comparison: Comparison) => {
  const labels = sideLabels(comparison);

  return [
    `### ${comparison.suite}: ${labels.b} vs ${labels.a} (${modelText(comparison)})`,
    flipTable({ flips: comparison.flips, labels }),
    rateLine(comparison),
    `Cost: ${costText(comparison.a)} → ${costText(comparison.b)} reported. Duration p50: ${durationText(comparison.a)} → ${durationText(comparison.b)}.`,
    changedLine(comparison.changed),
    ...statusLines({ comparison, labels }),
  ].join('\n\n');
};
