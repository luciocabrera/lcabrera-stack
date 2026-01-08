import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type SidePanelPosition = 'left' | 'right';
export type SidePanelProps = ComponentPropsWithoutRef<'dialog'> & {
  children: ReactNode;
  isOpen: boolean;
  isPinned?: boolean;
  onClose?: () => void;
  position?: SidePanelPosition;
  shouldShowOverlay?: boolean;
  size?: SidePanelSize;
};

export type SidePanelSize = 'lg' | 'md' | 'sm';
