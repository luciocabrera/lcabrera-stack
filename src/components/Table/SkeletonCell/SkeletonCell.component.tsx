import * as stylex from '@stylexjs/stylex';

import type { SkeletonCellProps } from './SkeletonCell.types';

import { skeletonCellStyles } from './SkeletonCell.stylex';

/**
 * Get width style based on data type
 */
const getWidthStyle = (dataType?: SkeletonCellProps['dataType']) => {
  switch (dataType) {
    case 'boolean': {
      return skeletonCellStyles.widthBoolean;
    }
    case 'currency': {
      return skeletonCellStyles.widthCurrency;
    }
    case 'date': {
      return skeletonCellStyles.widthDate;
    }
    case 'number': {
      return skeletonCellStyles.widthNumber;
    }
    default: {
      return skeletonCellStyles.widthString;
    }
  }
};

/**
 * Skeleton cell placeholder with pulse animation
 *
 * Renders a rounded rectangle that pulses to indicate loading.
 * Width varies based on the expected data type for realistic appearance.
 */
export const SkeletonCell = ({ dataType }: SkeletonCellProps) => (
  <div
    aria-hidden='true'
    {...stylex.props(skeletonCellStyles.base, getWidthStyle(dataType))}
  />
);
