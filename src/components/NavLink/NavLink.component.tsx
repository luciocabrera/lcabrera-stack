import * as stylex from '@stylexjs/stylex';
import { NavLink as RouterNavLink } from 'react-router';

import type { NavLinkProps } from './NavLink.types';

import { linkItemStyles } from './NavLink.stylex';
import { getClassName } from './utils';

export const NavLink = ({
  children,
  color = 'ghost',
  icon,
  orientation = 'vertical',
  size = 'md',
  width = 'full',
  ...props
}: NavLinkProps) => {
  return (
    <RouterNavLink
      className={({ isActive }) => {
        const classNameValue = getClassName({
          color,
          isActive,
          orientation,
          size,
          styles: linkItemStyles,
          width,
        });
        return classNameValue;
      }}
      {...props}
    >
      {icon && <span {...stylex.props(linkItemStyles.icon)}>{icon}</span>}
      <span {...stylex.props(linkItemStyles.label)}>{children}</span>
    </RouterNavLink>
  );
};
