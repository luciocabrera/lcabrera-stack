import { EraserIcon, SortAscIcon, SortDescIcon } from '#ui/components/Icons';

import type { CommandDescriptor, CommandId } from '../commands.types';

export const SORT_ASCENDING_COMMAND = {
  icon: SortAscIcon,
  id: 'column.sort.asc' as CommandId,
  label: 'Ascending',
} satisfies CommandDescriptor;

export const SORT_DESCENDING_COMMAND = {
  icon: SortDescIcon,
  id: 'column.sort.desc' as CommandId,
  label: 'Descending',
} satisfies CommandDescriptor;

export const CLEAR_SORTING_COMMAND = {
  icon: EraserIcon,
  id: 'column.sort.clear' as CommandId,
  label: 'Clear Sorting',
} satisfies CommandDescriptor;
