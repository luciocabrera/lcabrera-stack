import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { NavLinkProps } from 'react-router';

import type { ButtonProps } from '../Button/Button.types';

export type ToolbarSize = 'lg' | 'md' | 'sm';

export type ToolbarButtonConfig = Omit<ButtonProps, 'children' | 'width'> & {
  icon?: ReactNode;
  label: string;
  type: 'button';
};

export type ToolbarButtonItemProps = ComponentPropsWithoutRef<'button'> & Pick<ButtonProps, 'color' | 'isDisabled' | 'size'> & {
  icon?: ReactNode;
  label: string;
};

export type ToolbarItemConfig = ToolbarButtonConfig | ToolbarLinkConfig;

export type ToolbarLinkConfig = Omit<NavLinkProps, 'children' | 'className' | 'to'> & {
  icon?: ReactNode;
  label: string;
  to: string;
  type: 'link';
};

export type ToolbarLinkItemProps = Pick<NavLinkProps, 'end'> & {
  icon?: ReactNode;
  isActive?: boolean;
  label: string;
  size?: ToolbarSize;
  to: string;
};

export type ToolbarOrientation = 'horizontal' | 'vertical';

export type ToolbarProps = ComponentPropsWithoutRef<'nav'> & {
  items: ToolbarItemConfig[];
  orientation?: ToolbarOrientation;
  size?: ToolbarSize;
};
