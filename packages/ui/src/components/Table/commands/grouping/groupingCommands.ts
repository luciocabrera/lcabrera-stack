import { GroupRowsIcon, UngroupRowsIcon } from '#ui/components/Icons';

import type { CommandDescriptor, CommandId } from '../commands.types';

/**
 * The grouping capability's commands (ADR-011), the same shape as the pinning
 * and sorting sets. Grouping is a whole-table state expressed per column, so
 * both commands are still column commands: one names the key, the other removes
 * whatever key is applied.
 */
export const GROUP_BY_COLUMN_COMMAND = {
  icon: GroupRowsIcon,
  id: 'column.group.by' as CommandId,
  label: 'Group by This',
} satisfies CommandDescriptor;

export const CLEAR_GROUPING_COMMAND = {
  icon: UngroupRowsIcon,
  id: 'column.group.clear' as CommandId,
  label: 'Clear Grouping',
} satisfies CommandDescriptor;
