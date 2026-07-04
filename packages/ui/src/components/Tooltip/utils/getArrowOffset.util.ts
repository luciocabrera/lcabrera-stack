import type { ArrowOffsetParams } from '../Tooltip.types';

import { HALF_ARROW } from '../Tooltip.constants';

export const getArrowOffset = ({
  tooltipStart,
  triggerCenter,
}: ArrowOffsetParams) => triggerCenter - tooltipStart - HALF_ARROW;
