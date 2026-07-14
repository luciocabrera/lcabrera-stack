import type { ButtonProps } from '@repo/ui/components/Button/Button.types';
import type { NavLinkProps } from '@repo/ui/components/NavLink/NavLink.types';
import type {
  DesignSystemOrientation,
  DesignSystemSize,
} from '@repo/ui/types/design-system.types';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type NavbarButtonConfig = Omit<ButtonProps, 'children' | 'width'> & {
  readonly icon?: ReactNode;
  readonly label: string;
  readonly type: 'button';
};

export type NavbarItemConfig = NavbarButtonConfig | NavbarLinkConfig;

export type NavbarLinkConfig = Omit<NavLinkProps, 'children' | 'className'> & {
  readonly icon?: ReactNode;
  readonly label: string;
  readonly type: 'link';
  readonly variant?: Pick<ButtonProps, 'variant'>['variant'];
};

export type NavbarProps = ComponentPropsWithoutRef<'nav'> & {
  readonly isCompact?: boolean;
  readonly items: readonly NavbarItemConfig[];
  readonly orientation?: DesignSystemOrientation;
  readonly size?: DesignSystemSize;
};
