import * as stylex from '@stylexjs/stylex';
import { useCallback, useId, useRef, useState } from 'react';

import type { TooltipPlacement, TooltipProps } from './Tooltip.types';

import { styles } from './Tooltip.stylex';

const getTooltipPosition = (
  trigger: HTMLElement,
  tooltip: HTMLElement,
  placement: TooltipPlacement,
) => {
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

export const Tooltip = ({
  children,
  content,
  placement = 'top',
}: TooltipProps) => {
  const id = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const show = useCallback(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;

    tooltip.showPopover();

    const pos = getTooltipPosition(trigger, tooltip, placement);
    tooltip.style.top = `${pos.top}px`;
    tooltip.style.left = `${pos.left}px`;
    setIsVisible(true);
  }, [placement]);

  const hide = useCallback(() => {
    tooltipRef.current?.hidePopover();
    setIsVisible(false);
  }, []);

  return (
    <>
      <span
        aria-describedby={isVisible ? id : undefined}
        onBlur={hide}
        onFocus={show}
        onMouseEnter={show}
        onMouseLeave={hide}
        ref={triggerRef}
        {...stylex.props(styles.trigger)}
      >
        {children}
      </span>
      <div
        id={id}
        popover='manual'
        ref={tooltipRef}
        role='tooltip'
        {...stylex.props(styles.tooltip, styles[placement])}
      >
        {content}
      </div>
    </>
  );
};

Tooltip.displayName = 'Tooltip';
