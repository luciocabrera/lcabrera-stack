import * as stylex from '@stylexjs/stylex';
import { NavLink } from 'react-router';

import type { ToolbarLinkItemProps } from '../Toolbar.types';

import { linkItemStyles } from './ToolbarLinkItem.stylex';

export const ToolbarLinkItem = ({
  color = 'ghost',
  icon,
  label,
  orientation = 'vertical',
  size = 'md',
  ...props
}: ToolbarLinkItemProps) => {
  
  return (
    <NavLink
      className={({ isActive }) => {
        const classNameValue = stylex.props(
          linkItemStyles.base,
          linkItemStyles.orientation[orientation],
          linkItemStyles.size[size],
          linkItemStyles.color[color],
          isActive && linkItemStyles.active,
        ).className;
        return classNameValue ?? '';
      }}
      {...props}
    >
      {icon && <span {...stylex.props(linkItemStyles.icon)}>{icon}</span>}
      <span {...stylex.props(linkItemStyles.label)}>{label}</span>
    </NavLink>
  );
};
