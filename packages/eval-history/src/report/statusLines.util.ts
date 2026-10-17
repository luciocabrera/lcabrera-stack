import type { RunSide, SidePair } from './report.types.ts';
import type { sideLabels } from './sideLabels.util.ts';

type StatusLinesArgs = {
  readonly comparison: SidePair<Pick<RunSide, 'status'>>;
  readonly labels: ReturnType<typeof sideLabels>;
};

export const statusLines = ({
  comparison: { a, b },
  labels,
}: StatusLinesArgs) =>
  [
    { label: labels.a, side: a },
    { label: labels.b, side: b },
  ]
    .filter(({ side }) => side.status !== 'complete')
    .map(
      ({ label, side }) =>
        `${label} is ${side.status === 'partial' ? 'a partial' : 'an aborted'} run, so it holds only the trials that finished.`,
    );
