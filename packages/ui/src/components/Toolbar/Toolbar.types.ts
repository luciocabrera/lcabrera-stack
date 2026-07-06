import type { ButtonProps } from '@repo/ui/components/Button/Button.types';
import type { NavLinkProps } from '@repo/ui/components/NavLink/NavLink.types';
import type {
  DesignSystemOrientation,
  DesignSystemSize,
} from '@repo/ui/types/design-system.types';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type ToolbarButtonConfig = Omit<ButtonProps, 'children' | 'width'> & {
  readonly icon?: ReactNode;
  readonly label: string;
  readonly type: 'button';
};

export type ToolbarItemConfig = ToolbarButtonConfig | ToolbarLinkConfig;

export type ToolbarLinkConfig = Omit<NavLinkProps, 'children' | 'className'> & {
  readonly color?: Pick<ButtonProps, 'color'>['color'];
  readonly icon?: ReactNode;
  readonly label: string;
  readonly type: 'link';
};

export type ToolbarProps = ComponentPropsWithoutRef<'nav'> & {
  readonly isCompact?: boolean;
  readonly items: readonly ToolbarItemConfig[];
  readonly orientation?: DesignSystemOrientation;
  readonly size?: DesignSystemSize;
};
