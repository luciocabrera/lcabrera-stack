import type { StyleXStyles } from '@stylexjs/stylex';
import type { ReactNode } from 'react';

export type BoundsRect = {
  readonly bottom: number;
  readonly height: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly width: number;
};

export type MenuPosition = {
  readonly left: number;
  readonly top: number;
};

export type TableActionsPopoverProps = {
  readonly ariaLabel: string;
  readonly children: (renderProps: TableActionsPopoverRenderProps) => ReactNode;
  readonly customStylex?: StyleXStyles;
  readonly isDisabled?: boolean;
  readonly isEnabled?: boolean;
  readonly label: ReactNode;
};

export type TableActionsPopoverRenderProps = {
  readonly closeMenu: () => void;
};
