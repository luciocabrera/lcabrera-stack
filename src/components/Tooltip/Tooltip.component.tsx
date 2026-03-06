import * as stylex from '@stylexjs/stylex';
import { useCallback, useId, useRef, useState } from 'react';

import type { TooltipPlacement, TooltipProps } from './Tooltip.types';

import { styles } from './Tooltip.stylex';

const TRANSITION_DURATION_MS = 150;

const POSITION_AREA: Record<TooltipPlacement, string> = {
  bottom: 'bottom',
  left: 'left',
  right: 'right',
  top: 'top',
};

export const Tooltip = ({
  children,
  content,
  placement = 'top',
}: TooltipProps) => {
  const id = useId();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<number>(0);
  const [isVisible, setIsVisible] = useState(false);
  const anchorName = `--tooltip-${id.replaceAll(':', '')}`;

  const show = useCallback(() => {
    clearTimeout(hideTimeoutRef.current);
    tooltipRef.current?.showPopover();
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

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
        style={{ anchorName }}
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
        style={{
          justifySelf: 'anchor-center',
          opacity: isVisible ? 1 : 0,
          positionAnchor: anchorName,
          positionArea: POSITION_AREA[placement],
          transform: isVisible ? 'translate(0, 0)' : undefined,
        }}
      >
        {content}
      </div>
    </>
  );
};

Tooltip.displayName = 'Tooltip';
