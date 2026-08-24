import type { ComponentPropsWithoutRef, ReactNode, RefObject } from 'react';

export type SidePanelPosition = 'left' | 'right';
export type SidePanelProps = ComponentPropsWithoutRef<'dialog'> & {
  readonly children: ReactNode;
  readonly isOpen: boolean;
  readonly isPinned?: boolean;
  readonly onClose?: () => void;
  readonly portalContainer?: RefObject<HTMLElement | null>;
  readonly position?: SidePanelPosition;
  readonly shouldShowOverlay?: boolean;
  readonly size?: SidePanelSize;
};

export type SidePanelSize = 'lg' | 'md' | 'rail' | 'sm' | 'xs' | 'xxs';
