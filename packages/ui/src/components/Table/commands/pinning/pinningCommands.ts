import { PinLeftIcon, PinOffIcon, PinRightIcon } from '#ui/components/Icons';

import type { CommandDescriptor, CommandId } from '../commands.types';

/** The pinning capability's commands (ADR-011). */
export const PIN_LEFT_COMMAND = {
  icon: PinLeftIcon,
  id: 'column.pin.left' as CommandId,
  label: 'Pin Left',
} satisfies CommandDescriptor;

export const PIN_RIGHT_COMMAND = {
  icon: PinRightIcon,
  id: 'column.pin.right' as CommandId,
  label: 'Pin Right',
} satisfies CommandDescriptor;

export const CLEAR_PINNING_COMMAND = {
  icon: PinOffIcon,
  id: 'column.pin.clear' as CommandId,
  label: 'Clear Pinning',
} satisfies CommandDescriptor;
