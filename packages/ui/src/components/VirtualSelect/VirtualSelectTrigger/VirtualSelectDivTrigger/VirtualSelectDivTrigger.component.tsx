import type { KeyboardEvent } from 'react';

import type { VirtualSelectDivTriggerProps } from './VirtualSelectDivTrigger.types';

import { useToggleDropdown } from '../../contexts/meta/actions';
import {
  useGetIsAlwaysOpen,
  useGetIsInert,
  useGetIsOpen,
  useGetListboxId,
  useGetMode,
} from '../../contexts/meta/selectors';
import {
  assignTriggerRef,
  getTriggerStyleProps,
  handleDivTriggerKeyDown,
} from '../utils';

/**
 * Div-based trigger shell used when the native `<button>` cannot be (tag chips render
 * nested remove buttons) or when the listbox is always open.
 */
export const VirtualSelectDivTrigger = ({
  children,
  triggerRef,
}: VirtualSelectDivTriggerProps) => {
  const isAlwaysOpen = useGetIsAlwaysOpen();
  const isInert = useGetIsInert();
  const isOpen = useGetIsOpen();
  const listboxId = useGetListboxId();
  const mode = useGetMode();
  const toggleDropdown = useToggleDropdown();

  const shouldDisableInteraction = isInert || isAlwaysOpen;
  const interactionProps = isAlwaysOpen
    ? undefined
    : {
        'aria-controls': listboxId,
        'aria-disabled': shouldDisableInteraction,
        'aria-expanded': isOpen,
        'aria-haspopup': 'listbox' as const,
        onClick: shouldDisableInteraction ? undefined : toggleDropdown,
        onKeyDown: shouldDisableInteraction
          ? undefined
          : (event: KeyboardEvent<HTMLDivElement>) => {
              handleDivTriggerKeyDown({ event, onToggle: toggleDropdown });
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
        isInert,
        isOpen,
        isStatic: isAlwaysOpen,
        mode,
      })}
    >
      {children}
    </div>
  );
};
