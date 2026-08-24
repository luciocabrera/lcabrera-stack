import type { KeyboardEvent } from 'react';

import * as stylex from '@stylexjs/stylex';

import type { TooltipTriggerProps } from './TooltipTrigger.types';

import { styles } from './TooltipTrigger.stylex';
import { getIsNativeInteractiveElement } from './utils/getIsNativeInteractiveElement.util';

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
      ref={ref}
      role={shouldUseInteractiveTrigger ? 'button' : undefined}
      tabIndex={shouldUseInteractiveTrigger ? 0 : undefined}
      {...stylex.props(styles.trigger(anchorName))}
    >
      {children}
    </span>
  );
};
