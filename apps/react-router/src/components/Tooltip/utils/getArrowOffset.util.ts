import type { ArrowOffsetParams } from '../Tooltip.types.ts';

import { HALF_ARROW } from '../Tooltip.constants.ts';

export const getArrowOffset = ({
  tooltipStart,
  triggerCenter,
}: ArrowOffsetParams) => triggerCenter - tooltipStart - HALF_ARROW;
