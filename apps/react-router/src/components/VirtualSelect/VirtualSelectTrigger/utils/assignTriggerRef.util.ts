import type { VirtualSelectTriggerProps } from '../VirtualSelectTrigger.types';

export const assignTriggerRef = (
  triggerRef: VirtualSelectTriggerProps['triggerRef'],
  node: HTMLButtonElement | HTMLDivElement | null,
) => {
  triggerRef.current = node;
};
