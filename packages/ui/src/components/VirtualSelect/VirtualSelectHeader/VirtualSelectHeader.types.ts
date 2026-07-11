import type { VirtualSelectProps } from '../VirtualSelect.types';
import type { VirtualSelectTriggerProps } from '../VirtualSelectTrigger/VirtualSelectTrigger.types';

/**
 * Props for the header slice of VirtualSelect: the trigger props minus the
 * remove handler the header derives itself, plus the selection wiring it
 * needs to own tag removal.
 */
export type VirtualSelectHeaderProps = Omit<
  VirtualSelectTriggerProps,
  'onRemoveTag'
> & {
  /** Maps an option label back to its value when a tag is removed */
  readonly getValueFromLabel: (label: string) => string;
  /** Called with the next selected values after a tag is removed */
  readonly onChange: VirtualSelectProps['onChange'];
};
