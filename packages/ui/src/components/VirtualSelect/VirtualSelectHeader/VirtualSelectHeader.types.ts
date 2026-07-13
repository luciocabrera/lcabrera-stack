import type { VirtualSelectTriggerProps } from '../VirtualSelectTrigger/VirtualSelectTrigger.types';

/**
 * Props for the header slice of VirtualSelect — presentation wiring only.
 * Selection state and tag removal are store-connected inside the component
 * (selected labels via selector, removal via the toggle-option action).
 */
export type VirtualSelectHeaderProps = Pick<
  VirtualSelectTriggerProps,
  | 'isAlwaysOpen'
  | 'isBusy'
  | 'isOpen'
  | 'listboxId'
  | 'mode'
  | 'onToggle'
  | 'placeholder'
>;
