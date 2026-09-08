import type { ComponentPropsWithoutRef, ReactNode, RefObject } from 'react';

export type SidePanelPosition = 'left' | 'right';
export type SidePanelProps = ComponentPropsWithoutRef<'dialog'> & {
  readonly children: ReactNode;
  readonly isOpen: boolean;
  readonly isPinned?: boolean;
  readonly isResizable?: boolean;
  readonly onClose?: () => void;
  /** Called on every frame of a drag; commit with `onWidthCommit`. */
  readonly onWidthChange?: (width: number) => void;
  /** Called once a resize gesture ends, for a consumer that persists it. */
  readonly onWidthCommit?: (width: number) => void;
  readonly portalContainer?: RefObject<HTMLElement | null>;
  readonly position?: SidePanelPosition;
  readonly shouldShowOverlay?: boolean;
  readonly size?: SidePanelSize;
  /** Overrides `size`, clamped to the panel's own band. */
  readonly width?: number;
};

export type SidePanelSize = 'lg' | 'md' | 'rail' | 'sm' | 'xs' | 'xxs';
