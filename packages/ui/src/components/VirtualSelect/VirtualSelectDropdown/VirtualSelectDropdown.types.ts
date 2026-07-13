import type { VirtualSelectProps } from '../VirtualSelect.types';

/**
 * Props for the dropdown slice of VirtualSelect — positioning and listbox
 * wiring only; the list state flows through the lifted VirtualList
 * providers mounted by the VirtualSelect shell.
 */
export type VirtualSelectDropdownProps = Pick<
  VirtualSelectProps,
  'customStylex'
> & {
  /** Static positioning when true; floating dropdown otherwise */
  readonly isAlwaysOpen: boolean;
  /** Renders nothing while false (closed and not always-open) */
  readonly isListVisible: boolean;
  /** id wired to the trigger's `aria-controls` */
  readonly listboxId: string;
  /** CSS max-height forwarded to the VirtualList scroll area */
  readonly listMaxHeight: string;
  /** Expands the dropdown to fill available vertical space */
  readonly shouldFillHeight: boolean;
};
