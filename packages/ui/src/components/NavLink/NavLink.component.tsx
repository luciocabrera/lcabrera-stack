import { Tooltip } from '@repo/ui/components/Tooltip';
import * as stylex from '@stylexjs/stylex';
import { NavLink as RouterNavLink } from 'react-router';

import type { NavLinkProps } from './NavLink.types';

import { linkItemStyles } from './NavLink.stylex';
import { getClassName } from './utils';

export const NavLink = ({
  children,
  color,
  customStylex,
  icon,
  isIconOnly = false,
  orientation = 'vertical',
  prefetch = 'intent',
  size = 'md',
  tooltipContent,
  tooltipPlacement = 'top',
  variant,
  ...props
}: NavLinkProps) => {
  const resolvedVariant = variant ?? color ?? 'ghost';

  const link = (
    <RouterNavLink
      className={({ isActive }: { readonly isActive: boolean }) => {
        const classNameValue = getClassName({
          customStylex,
          isActive,
          isIconOnly,
          orientation,
          size,
          styles: linkItemStyles,
          variant: resolvedVariant,
        });
        return classNameValue;
      }}
      prefetch={prefetch}
      {...props}
    >
      {icon && <span {...stylex.props(linkItemStyles.icon)}>{icon}</span>}
      <span
        {...stylex.props(
          linkItemStyles.label,
          isIconOnly && linkItemStyles.labelHidden,
        )}
      >
        {children}
      </span>
    </RouterNavLink>
  );

  if (tooltipContent) {
    return (
      <Tooltip content={tooltipContent} placement={tooltipPlacement}>
        {link}
      </Tooltip>
    );
  }

  return link;
};
