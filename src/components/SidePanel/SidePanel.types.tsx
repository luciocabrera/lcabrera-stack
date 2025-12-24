import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type SidePanelPosition = 'left' | 'right';
export type SidePanelProps = ComponentPropsWithoutRef<'div'> & {
  children: ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  position?: SidePanelPosition;
  showOverlay?: boolean;
  size?: SidePanelSize;
};

export type SidePanelSize = 'lg' | 'md' | 'sm';
