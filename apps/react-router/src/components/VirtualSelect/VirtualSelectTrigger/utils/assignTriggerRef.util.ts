import type { VirtualSelectTriggerProps } from '../VirtualSelectTrigger.types';

type AssignTriggerRefArgs = {
  triggerRef: VirtualSelectTriggerProps['triggerRef'];
  node: HTMLButtonElement | HTMLDivElement | null;
};

export const assignTriggerRef = ({
  triggerRef,
  node,
}: AssignTriggerRefArgs) => {
  triggerRef.current = node;
};
