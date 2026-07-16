import type { KeyboardEvent } from 'react';

import * as stylex from '@stylexjs/stylex';

import type { TooltipTriggerProps } from './TooltipTrigger.types';

import { styles } from './TooltipTrigger.stylex';
import { getIsNativeInteractiveElement } from './utils/getIsNativeInteractiveElement.util';

/**
 * Anchored inline wrapper that shows/hides the tooltip on hover, focus, and
 * touch. When the child is not a natively interactive element it also adds
 * `role='button'`, `tabIndex`, and keyboard handling (`Enter`/`Space` show,
 * `Escape` hides).
 */
export const TooltipTrigger = ({
  anchorName,
  children,
  id,
  onHide,
  onShow,
  ref,
}: TooltipTriggerProps) => {
  const shouldUseInteractiveTrigger = !getIsNativeInteractiveElement(children);

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Escape') {
      onHide();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onShow();
    }
  };

  return (
    <span
      aria-describedby={id}
      onBlur={onHide}
      onFocus={onShow}
      onKeyDown={shouldUseInteractiveTrigger ? handleKeyDown : undefined}
      onMouseEnter={onShow}
      onMouseLeave={onHide}
      onTouchEnd={onHide}
      onTouchStart={onShow}
      popoverTarget={id}
      ref={ref}
      role={shouldUseInteractiveTrigger ? 'button' : undefined}
      // For non-native triggers we intentionally provide keyboard focus + role.
      // NOSONAR
      tabIndex={shouldUseInteractiveTrigger ? 0 : undefined}
      {...stylex.props(styles.trigger(anchorName))}
    >
      {children}
    </span>
  );
};
