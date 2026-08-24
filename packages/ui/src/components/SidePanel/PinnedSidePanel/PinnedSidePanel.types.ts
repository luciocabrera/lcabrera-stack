import type { ComponentPropsWithoutRef, ReactNode, RefObject } from 'react';

import type { SidePanelPosition, SidePanelSize } from '../SidePanel.types';

export type PinnedSidePanelProps = ComponentPropsWithoutRef<'dialog'> & {
  readonly children: ReactNode;
  readonly portalContainer?: RefObject<HTMLElement | null>;
  readonly position: SidePanelPosition;
  readonly size: SidePanelSize;
};
