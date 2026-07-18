import {
  PinLeftIcon,
  PinOffIcon,
  PinRightIcon,
} from '@repo/ui/components/Icons';

import type { CommandDescriptor, CommandId } from '../CommandDescriptor.types';

/**
 * The pinning capability's commands (ADR-011). Identity lives here once; every
 * surface — header menu (live), drawer (draft) — renders from these instead of
 * re-declaring the label and icon. Descriptors are overridable defaults: a
 * surface may substitute its own icon (e.g. a toolbar's clear affordance)
 * without forking the identity.
 */
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
