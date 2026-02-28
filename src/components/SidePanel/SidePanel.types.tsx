import type { ComponentPropsWithoutRef, ReactNode, RefObject } from 'react';

export type SidePanelPosition = 'left' | 'right';
export type SidePanelProps = ComponentPropsWithoutRef<'dialog'> & {
  children: ReactNode;
  isOpen: boolean;
  isPinned?: boolean;
  onClose?: () => void;
  /** When pinned, portal the aside into this container (for components rendered deep in the DOM tree) */
  portalContainer?: RefObject<HTMLElement | null>;
  position?: SidePanelPosition;
  shouldShowOverlay?: boolean;
  size?: SidePanelSize;
};

export type SidePanelSize = 'lg' | 'md' | 'sm';
