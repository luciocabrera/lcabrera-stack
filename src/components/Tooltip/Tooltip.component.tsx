import * as stylex from '@stylexjs/stylex';
import { useCallback, useId, useRef, useState } from 'react';

import type { TooltipProps } from './Tooltip.types';

import { styles } from './Tooltip.stylex';
import { getTooltipPosition } from './utils';

const TRANSITION_DURATION_MS = 150;

export const Tooltip = ({
  children,
  content,
  placement = 'top',
}: TooltipProps) => {
  const id = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<number>(0);
  const [isVisible, setIsVisible] = useState(false);

  const show = useCallback(() => {
    clearTimeout(hideTimeoutRef.current);
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;

    tooltip.showPopover();
    const pos = getTooltipPosition({ placement, tooltip, trigger });
    tooltip.style.top = `${pos.top}px`;
    tooltip.style.left = `${pos.left}px`;
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, [placement]);

  const hide = useCallback(() => {
    setIsVisible(false);
    const timeoutId = globalThis.setTimeout(() => {
      tooltipRef.current?.hidePopover();
    }, TRANSITION_DURATION_MS);
    hideTimeoutRef.current = timeoutId as unknown as number;
  }, []);

  return (
    <>
      <span
        aria-describedby={id}
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
        {...stylex.props(
          styles.tooltip,
          styles[placement],
        )}
        style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translate(0, 0)' : undefined }}
      >
        {content}
      </div>
    </>
  );
};

Tooltip.displayName = 'Tooltip';
