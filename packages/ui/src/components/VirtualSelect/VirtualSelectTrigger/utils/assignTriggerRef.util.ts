import type { VirtualSelectTriggerRef } from '../VirtualSelectTrigger.types';

type AssignTriggerRefArgs = {
  node: HTMLButtonElement | HTMLDivElement | null;
  triggerRef: VirtualSelectTriggerRef;
};

export const assignTriggerRef = ({
  node,
  triggerRef,
}: AssignTriggerRefArgs) => {
  triggerRef.current = node ?? undefined;
};
