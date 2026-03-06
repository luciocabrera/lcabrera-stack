import type { TooltipPlacement } from '../Tooltip.types';

export type GetTooltipPositionArgs = {
  placement: TooltipPlacement;
  tooltip: HTMLElement;
  trigger: HTMLElement;
};

export const getTooltipPosition = ({
  placement,
  tooltip,
  trigger,
}: GetTooltipPositionArgs) => {
  const rect = trigger.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  switch (placement) {
    case 'bottom': {
      return {
        left: rect.left + rect.width / 2 - tooltipRect.width / 2,
        top: rect.bottom,
      };
    }
    case 'left': {
      return {
        left: rect.left - tooltipRect.width,
        top: rect.top + rect.height / 2 - tooltipRect.height / 2,
      };
    }
    case 'right': {
      return {
        left: rect.right,
        top: rect.top + rect.height / 2 - tooltipRect.height / 2,
      };
    }
    case 'top': {
      return {
        left: rect.left + rect.width / 2 - tooltipRect.width / 2,
        top: rect.top - tooltipRect.height,
      };
    }
  }
};
