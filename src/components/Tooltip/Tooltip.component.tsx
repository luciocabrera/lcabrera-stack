import * as stylex from '@stylexjs/stylex';
import { useCallback, useId, useRef, useState } from 'react';

import type { TooltipProps } from './Tooltip.types';

import { ARROW_STYLES, POSITION_AREA, TRANSITION_DURATION_MS } from './Tooltip.constants';
import { styles } from './Tooltip.stylex';

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
        popoverTarget={id}
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
        <span
          {...stylex.props(styles.arrow, ARROW_STYLES[placement])}
        />
        {content}
      </div>
    </>
  );
};

Tooltip.displayName = 'Tooltip';
