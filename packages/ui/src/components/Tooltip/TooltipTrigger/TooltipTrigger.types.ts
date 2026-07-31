import type { ReactNode, Ref } from 'react';

export type TooltipTriggerProps = {
  /** CSS anchor name binding the trigger to the tooltip popover */
  readonly anchorName: string;
  /** The element that triggers the tooltip on hover/focus */
  readonly children: ReactNode;
  /** Popover id linking the trigger to the tooltip via `aria-describedby` */
  readonly id: string;
  /** Called when the tooltip should hide */
  readonly onHide: () => void;
  /** Called when the tooltip should show */
  readonly onShow: () => void;
  /** Trigger span ref used by the parent to measure anchor geometry */
  readonly ref: Ref<HTMLSpanElement>;
};
