import {
  CLEAR_PINNING_COMMAND,
  PIN_LEFT_COMMAND,
  PIN_RIGHT_COMMAND,
} from '#ui/components/Table/commands';

export const COLUMN_PINNING_TARGETS = {
  clear: { command: CLEAR_PINNING_COMMAND, side: undefined },
  left: { command: PIN_LEFT_COMMAND, side: 'left' },
  right: { command: PIN_RIGHT_COMMAND, side: 'right' },
} as const;
