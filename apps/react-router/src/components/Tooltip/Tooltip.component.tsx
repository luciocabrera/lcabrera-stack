import type { KeyboardEvent } from 'react';

import * as stylex from '@stylexjs/stylex';
import { isValidElement, useId, useRef, useState } from 'react';

import type { TooltipProps } from './Tooltip.types';

import { ARROW_STYLES, TRANSITION_DURATION_MS } from './Tooltip.constants';
import { styles } from './Tooltip.stylex';
import { getArrowOffset, getArrowStyle } from './utils';

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
  const [arrowOffset, setArrowOffset] = useState<number | undefined>();

  const hasNativeInteractiveChild =
    isValidElement(children) &&
    typeof children.type === 'string' &&
    ['a', 'button', 'input', 'select', 'summary', 'textarea'].includes(
      children.type,
    );
  const shouldUseInteractiveTrigger = !hasNativeInteractiveChild;

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
    hideTimeoutRef.current = timeoutId as unknown as number;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Escape') {
      handleHide();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleShow();
    }
  };

  return (
    <>
      <span
        aria-describedby={id}
        onBlur={handleHide}
        onFocus={handleShow}
        onKeyDown={shouldUseInteractiveTrigger ? handleKeyDown : undefined}
        onMouseEnter={handleShow}
        onMouseLeave={handleHide}
        onTouchEnd={handleHide}
        onTouchStart={handleShow}
        popoverTarget={id}
        ref={triggerRef}
        role={shouldUseInteractiveTrigger ? 'button' : undefined}
        // For non-native triggers we intentionally provide keyboard focus + role.
        // NOSONAR
        tabIndex={shouldUseInteractiveTrigger ? 0 : undefined}
        {...stylex.props(styles.trigger(anchorName))}
      >
        {children}
      </span>
      <div
        id={id}
        popover='manual'
        ref={tooltipRef}
        role='tooltip'
        {...stylex.props(
          styles.tooltip(anchorName),
          styles[placement],
          isVisible ? styles.tooltipVisible : undefined,
        )}
      >
        <span
          {...stylex.props(
            styles.arrow,
            ARROW_STYLES[placement],
            arrowOffset !== undefined && getArrowStyle(placement, arrowOffset),
          )}
        />
        {content}
      </div>
    </>
  );
};

Tooltip.displayName = 'Tooltip';
