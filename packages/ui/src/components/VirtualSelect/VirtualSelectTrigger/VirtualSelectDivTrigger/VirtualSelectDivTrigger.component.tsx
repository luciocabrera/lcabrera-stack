import type { KeyboardEvent } from 'react';

import type { VirtualSelectDivTriggerProps } from './VirtualSelectDivTrigger.types';

import {
  assignTriggerRef,
  getTriggerStyleProps,
  handleDivTriggerKeyDown,
} from '../utils';

/**
 * Div-based trigger shell used when the native `<button>` cannot be (tag
 * chips render nested remove buttons) or when the listbox is always open.
 * The static (`isAlwaysOpen`) and interactive variants share the same shell —
 * only the interaction props differ, so they are spread conditionally.
 */
export const VirtualSelectDivTrigger = ({
  children,
  isAlwaysOpen,
  isBusy,
  isOpen,
  listboxId,
  mode,
  onToggle,
  triggerRef,
}: VirtualSelectDivTriggerProps) => {
  const shouldDisableInteraction = isBusy || isAlwaysOpen;
  const interactionProps = isAlwaysOpen
    ? undefined
    : {
        'aria-controls': listboxId,
        'aria-disabled': shouldDisableInteraction,
        'aria-expanded': isOpen,
        'aria-haspopup': 'listbox' as const,
        onClick: shouldDisableInteraction ? undefined : onToggle,
        onKeyDown: shouldDisableInteraction
          ? undefined
          : (event: KeyboardEvent<HTMLDivElement>) => {
              handleDivTriggerKeyDown({ event, onToggle });
            },
        role: 'button' as const,
        tabIndex: shouldDisableInteraction ? -1 : 0,
      };

  return (
    <div
      ref={(node) => {
        assignTriggerRef({ node, triggerRef });
      }}
      {...interactionProps}
      {...getTriggerStyleProps({
        isBusy,
        isOpen,
        isStatic: isAlwaysOpen,
        mode,
      })}
    >
      {children}
    </div>
  );
};
