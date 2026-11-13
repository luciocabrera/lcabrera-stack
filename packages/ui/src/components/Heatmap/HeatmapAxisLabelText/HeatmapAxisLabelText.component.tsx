import * as stylex from '@stylexjs/stylex';
import { Link } from 'react-router';

import { heatmapAxisLabelStyles } from '#ui/components/Heatmap/HeatmapAxisLabels/HeatmapAxisLabels.stylex';
import { accessibility } from '#ui/design-system/tokens/commons.stylex';

import type { HeatmapAxisLabelTextProps } from './HeatmapAxisLabelText.types';

export const HeatmapAxisLabelText = ({
  isHidden,
  label,
  to,
}: HeatmapAxisLabelTextProps) => {
  const text =
    to === undefined ? (
      label
    ) : (
      <Link to={to} {...stylex.props(heatmapAxisLabelStyles.link)}>
        {label}
      </Link>
    );

  return isHidden ? (
    <span {...stylex.props(accessibility.visuallyHidden)}>{text}</span>
  ) : (
    text
  );
};
