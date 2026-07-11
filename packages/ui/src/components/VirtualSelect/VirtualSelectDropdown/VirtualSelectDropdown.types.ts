import type { VirtualListDataState } from '@repo/ui/components/VirtualList';

import type { VirtualSelectProps } from '../VirtualSelect.types';

/**
 * Props for the dropdown slice of VirtualSelect: the resolved listbox wiring
 * plus the selection-change plumbing the dropdown owns.
 */
export type VirtualSelectDropdownProps = Pick<
  VirtualSelectProps,
  | 'customStylex'
  | 'mode'
  | 'onChange'
  | 'onFetchInitial'
  | 'onFetchMore'
  | 'selected'
> & {
  /** Resolved data state — async `dataState` or the static-options fallback */
  readonly dataState: VirtualListDataState;
  /** Maps an option label back to its value when resolving list changes */
  readonly getValueFromLabel: (label: string) => string;
  /** Static positioning when true; floating dropdown otherwise */
  readonly isAlwaysOpen: boolean;
  /** Renders nothing while false (closed and not always-open) */
  readonly isListVisible: boolean;
  /** id wired to the trigger's `aria-controls` */
  readonly listboxId: string;
  /** CSS max-height forwarded to the VirtualList scroll area */
  readonly listMaxHeight: string;
  /** Requests the parent close the dropdown (after a single-mode pick) */
  readonly onClose: () => void;
  /** Labels of the selected values, in `selected` order */
  readonly selectedLabels: readonly string[];
  /** Expands the dropdown to fill available vertical space */
  readonly shouldFillHeight: boolean;
};
