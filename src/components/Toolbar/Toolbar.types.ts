import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { NavLinkProps } from 'react-router';

import type { DesignSystemOrientation, DesignSystemSize } from '@/types/design-system.types';

import type { ButtonProps } from '../Button/Button.types';

export type ToolbarButtonConfig = Omit<ButtonProps, 'children' | 'width'> & {
  icon?: ReactNode;
  label: string;
  type: 'button';
};

export type ToolbarButtonItemProps = ComponentPropsWithoutRef<'button'> &
  Pick<ButtonProps, 'color' | 'isDisabled' | 'size'> & {
    icon?: ReactNode;
    label: string;
  };

export type ToolbarItemConfig = ToolbarButtonConfig | ToolbarLinkConfig;

export type ToolbarLinkConfig = Omit<
  NavLinkProps,
  'children' | 'className' 
> & {
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

