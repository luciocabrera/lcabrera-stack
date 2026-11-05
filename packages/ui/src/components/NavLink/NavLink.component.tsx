import type { NavLinkRenderProps } from 'react-router';

import * as stylex from '@stylexjs/stylex';
import { NavLink as RouterNavLink } from 'react-router';

import { Tooltip } from '#ui/components/Tooltip';

import type { NavLinkProps } from './NavLink.types';

import { linkItemStyles } from './NavLink.stylex';
import { getClassName, getInlineClassName } from './utils';

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
  const isInline = variant === 'inline';

  const link = (
    <RouterNavLink
      aria-disabled={isBusy || undefined}
      className={({ isActive, isPending }: NavLinkRenderProps) =>
        variant === 'inline'
          ? getInlineClassName({
              customStylex,
              isActive,
              isBusy,
              isPending,
              styles: linkItemStyles,
            })
          : getClassName({
              customStylex,
              isActive,
              isBusy,
              isIconOnly,
              orientation,
              size,
              styles: linkItemStyles,
              variant,
            })
      }
      prefetch={prefetch}
      {...props}
    >
      {Boolean(isBusy) && (
        <span {...stylex.props(linkItemStyles.busyOverlay)}>
          <span {...stylex.props(linkItemStyles.busyWave)} />
        </span>
      )}
      {Boolean(icon) && (
        <span
          {...stylex.props(
            isInline ? linkItemStyles.inline.icon : linkItemStyles.icon,
          )}
        >
          {icon}
        </span>
      )}
      <span
        {...stylex.props(
          !isInline && linkItemStyles.label,
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
