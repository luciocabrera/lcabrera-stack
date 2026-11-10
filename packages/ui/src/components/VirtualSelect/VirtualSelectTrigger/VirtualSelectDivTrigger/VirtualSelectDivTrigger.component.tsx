import type { KeyboardEvent } from 'react';

import { useGetIsTopAttached } from '#ui/components/VirtualList/contexts/list/selectors';

import type { VirtualSelectDivTriggerProps } from './VirtualSelectDivTrigger.types';

import { useToggleDropdown } from '../../contexts/meta/actions';
import {
  useGetAttachedEdge,
  useGetIsAlwaysOpen,
  useGetIsInert,
  useGetIsOpen,
  useGetLabelId,
  useGetListboxId,
} from '../../contexts/meta/selectors';
import {
  assignTriggerRef,
  getTriggerLabelProps,
  getTriggerStyleProps,
  handleDivTriggerKeyDown,
} from '../utils';

export const VirtualSelectDivTrigger = ({
  children,
  hasTags,
  triggerRef,
}: VirtualSelectDivTriggerProps) => {
  const isAlwaysOpen = useGetIsAlwaysOpen();
  const attachedEdge = useGetAttachedEdge();
  const isAttachedBelow = useGetIsTopAttached();
  const isInert = useGetIsInert();
  const isOpen = useGetIsOpen();
  const labelId = useGetLabelId();
  const listboxId = useGetListboxId();
  const toggleDropdown = useToggleDropdown();

  const shouldDisableInteraction = isInert || isAlwaysOpen;
  const interactionProps = isAlwaysOpen
    ? undefined
    : {
        ...getTriggerLabelProps({ labelId }),
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
        attachedEdge,
        hasTags,
        isAttachedBelow,
        isInert,
        isOpen,
        isStatic: isAlwaysOpen,
      })}
    >
      {children}
    </div>
  );
};
