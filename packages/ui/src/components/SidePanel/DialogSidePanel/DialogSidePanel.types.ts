import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import type { SidePanelPosition, SidePanelSize } from '../SidePanel.types';

export type DialogSidePanelProps = ComponentPropsWithoutRef<'dialog'> & {
  readonly children: ReactNode;
  readonly isOpen: boolean;
  readonly onClose?: () => void;
  readonly position: SidePanelPosition;
  readonly shouldShowOverlay: boolean;
  readonly size: SidePanelSize;
};
