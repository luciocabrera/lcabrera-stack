import { useId, useRef, useState } from 'react';

import type { TooltipProps } from './Tooltip.types';

import { TRANSITION_DURATION_MS } from './Tooltip.constants';
import { TooltipContent } from './TooltipContent/TooltipContent.component';
import { TooltipTrigger } from './TooltipTrigger/TooltipTrigger.component';
import { getArrowOffset } from './utils';

export const Tooltip = ({
  children,
  content,
  placement = 'top',
}: TooltipProps) => {
  const id = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<
    ReturnType<typeof globalThis.setTimeout> | undefined
  >(undefined);

  const [isVisible, setIsVisible] = useState(false);
  const [arrowOffset, setArrowOffset] = useState<number | undefined>();

  const anchorName = `--tooltip-${id.replaceAll(':', '')}`;

  const handleShow = () => {
    clearTimeout(hideTimeoutRef.current);
    tooltipRef.current?.showPopover();
    requestAnimationFrame(() => {
      setIsVisible(true);
      if (triggerRef.current && tooltipRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const isVertical = placement === 'top' || placement === 'bottom';
        const offset = getArrowOffset({
          placement,
          tooltipStart: isVertical ? tooltipRect.left : tooltipRect.top,
          triggerCenter: isVertical
            ? triggerRect.left + triggerRect.width / 2
            : triggerRect.top + triggerRect.height / 2,
        });
        setArrowOffset(offset);
      }
    });
  };

  const handleHide = () => {
    setIsVisible(false);
    const timeoutId = globalThis.setTimeout(() => {
      tooltipRef.current?.hidePopover();
    }, TRANSITION_DURATION_MS);
    hideTimeoutRef.current = timeoutId;
  };

  return (
    <>
      <TooltipTrigger
        anchorName={anchorName}
        id={id}
        onHide={handleHide}
        onShow={handleShow}
        ref={triggerRef}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent
        anchorName={anchorName}
        arrowOffset={arrowOffset}
        id={id}
        isVisible={isVisible}
        placement={placement}
        ref={tooltipRef}
      >
        {content}
      </TooltipContent>
    </>
  );
};
