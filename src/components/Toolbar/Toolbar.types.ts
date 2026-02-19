import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import type { ButtonProps } from '@/components/Button/Button.types';
import type { NavLinkProps } from '@/components/NavLink/NavLink.types';
import type {
  DesignSystemOrientation,
  DesignSystemSize,
} from '@/types/design-system.types';

export type ToolbarButtonConfig = Omit<ButtonProps, 'children' | 'width'> & {
  icon?: ReactNode;
  label: string;
  type: 'button';
};

export type ToolbarItemConfig = ToolbarButtonConfig | ToolbarLinkConfig;

export type ToolbarLinkConfig = Omit<NavLinkProps, 'children' | 'className'> & {
  color?: Pick<ButtonProps, 'color'>['color'];
  icon?: ReactNode;
  label: string;
  type: 'link';
};

export type ToolbarProps = ComponentPropsWithoutRef<'nav'> & {
  items: ToolbarItemConfig[];
  orientation?: DesignSystemOrientation;
  size?: DesignSystemSize;
};
