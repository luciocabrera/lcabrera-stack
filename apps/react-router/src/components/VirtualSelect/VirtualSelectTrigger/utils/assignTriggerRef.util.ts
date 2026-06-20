import type { VirtualSelectTriggerProps } from '../VirtualSelectTrigger.types';

type AssignTriggerRefArgs = {
  node: HTMLButtonElement | HTMLDivElement | null;
  triggerRef: VirtualSelectTriggerProps['triggerRef'];
};

export const assignTriggerRef = ({
  node,
  triggerRef,
}: AssignTriggerRefArgs) => {
  triggerRef.current = node;
};
