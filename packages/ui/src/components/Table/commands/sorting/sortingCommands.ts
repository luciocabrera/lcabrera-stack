import {
  EraserIcon,
  SortAscIcon,
  SortDescIcon,
} from '@repo/ui/components/Icons';

import type { CommandDescriptor, CommandId } from '../commands.types';

/**
 * The sorting capability's commands (ADR-011). Identical shape to the pinning
 * commands — identity defined once, shared by the header menu (live) and the
 * settings drawer (draft). This is the cross-capability check (ADR-011,
 * validation): the same `CommandDescriptor` and the same
 * `deriveToggleCommandState` predicate serve sorting unchanged, so the
 * foundation is not fitted to pinning.
 */
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
