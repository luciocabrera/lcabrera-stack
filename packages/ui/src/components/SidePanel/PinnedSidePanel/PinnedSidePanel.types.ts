import type { ComponentPropsWithoutRef, ReactNode, RefObject } from 'react';

import type { SidePanelPosition, SidePanelSize } from '../SidePanel.types';

export type PinnedSidePanelProps = ComponentPropsWithoutRef<'dialog'> & {
  readonly children: ReactNode;
  /** Portal the aside into this container (for components rendered deep in the DOM tree) */
  readonly portalContainer?: RefObject<HTMLElement | null>;
  readonly position: SidePanelPosition;
  readonly size: SidePanelSize;
};
