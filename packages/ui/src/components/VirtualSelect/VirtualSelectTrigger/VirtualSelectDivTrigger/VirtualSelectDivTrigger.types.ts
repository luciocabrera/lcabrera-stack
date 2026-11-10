import type { ReactNode } from 'react';

import type { VirtualSelectTriggerRef } from '../VirtualSelectTrigger.types';

export type VirtualSelectDivTriggerProps = {
  readonly children: ReactNode;
  readonly hasTags: boolean;
  readonly triggerRef: VirtualSelectTriggerRef;
};
