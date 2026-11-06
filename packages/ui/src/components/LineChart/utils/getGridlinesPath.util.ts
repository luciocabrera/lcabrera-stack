import { formatPathPoint } from '@lcabrera/utils/chart/format-path-point.util';

import { LINE_CHART } from '#ui/components/LineChart/LineChart.constants';

type GetGridlinesPathArgs = {
  readonly ticks: readonly { readonly at: number }[];
};

export const getGridlinesPath = ({ ticks }: GetGridlinesPathArgs) =>
  ticks
    .map(
      ({ at }) =>
        `M${formatPathPoint({ x: 0, y: at })}L${formatPathPoint({ x: LINE_CHART.plotSize, y: at })}`,
    )
    .join('');
