import type { ReactNode, Ref } from 'react';

export type TooltipTriggerProps = {
  readonly anchorName: string;
  readonly children: ReactNode;
  readonly id: string;
  readonly onHide: () => void;
  readonly onShow: () => void;
  readonly ref: Ref<HTMLSpanElement>;
};
