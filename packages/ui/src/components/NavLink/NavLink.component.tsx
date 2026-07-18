import { Tooltip } from '@repo/ui/components/Tooltip';
import * as stylex from '@stylexjs/stylex';
import { NavLink as RouterNavLink } from 'react-router';

import type { NavLinkProps } from './NavLink.types';

import { linkItemStyles } from './NavLink.stylex';
import { getClassName } from './utils';

export const NavLink = ({
  children,
  customStylex,
  icon,
  isBusy = false,
  isIconOnly = false,
  orientation = 'vertical',
  prefetch = 'intent',
  size = 'sm',
  tooltipContent,
  tooltipPlacement = 'top',
  variant = 'outline',
  ...props
}: NavLinkProps) => {
  const link = (
    <RouterNavLink
      aria-disabled={isBusy || undefined}
      className={({ isActive }: { readonly isActive: boolean }) => {
        const classNameValue = getClassName({
          customStylex,
          isActive,
          isBusy,
          isIconOnly,
          orientation,
          size,
          styles: linkItemStyles,
          variant,
        });
        return classNameValue;
      }}
      prefetch={prefetch}
      {...props}
    >
      {Boolean(isBusy) && (
        <span {...stylex.props(linkItemStyles.busyOverlay)}>
          <span {...stylex.props(linkItemStyles.busyWave)} />
        </span>
      )}
      {Boolean(icon) && (
        <span {...stylex.props(linkItemStyles.icon)}>{icon}</span>
      )}
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
