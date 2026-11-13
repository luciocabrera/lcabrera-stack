import type { To } from 'react-router';

export type HeatmapAxisLabelTextProps = {
  readonly isHidden: boolean;
  readonly label: string;
  readonly to: To | undefined;
};
