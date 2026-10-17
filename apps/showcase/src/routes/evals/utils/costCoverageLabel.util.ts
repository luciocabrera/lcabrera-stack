import { costLabel } from './costLabel.util';

type CostCoverageLabelArgs = {
  readonly covered: number;
  readonly missing: string;
  readonly trials: number;
  readonly usd: number | undefined;
  readonly verb: string;
};

export const costCoverageLabel = ({
  covered,
  missing,
  trials,
  usd,
  verb,
}: CostCoverageLabelArgs) => {
  if (covered === 0 || usd === undefined) {
    return missing;
  }

  return covered < trials
    ? `${costLabel(usd)} (${String(covered)} of ${String(trials)} trials ${verb})`
    : costLabel(usd);
};
