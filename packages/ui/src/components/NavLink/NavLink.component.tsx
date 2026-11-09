import type { NavLinkRenderProps } from 'react-router';

import { Link as RouterLink, NavLink as RouterNavLink } from 'react-router';

import { Tooltip } from '#ui/components/Tooltip';

import type { NavLinkProps } from './NavLink.types';

import { NavLinkContent } from './NavLinkContent/NavLinkContent.component';
import { getNavLinkClassName, toLinkProps } from './utils';

export const NavLink = ({
  caseSensitive,
  children,
  customStylex,
  end,
  icon,
  isActive: activeOverride,
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
  const classNameFor = ({
    isActive,
    isPending,
  }: Pick<NavLinkRenderProps, 'isActive' | 'isPending'>) =>
    getNavLinkClassName({
      customStylex,
      isActive,
      isBusy,
      isIconOnly,
      isPending,
      orientation,
      size,
      variant,
    });
  const content = (
    <NavLinkContent
      icon={icon}
      isBusy={isBusy}
      isIconOnly={isIconOnly}
      isInline={variant === 'inline'}
    >
      {children}
    </NavLinkContent>
  );
  const link =
    activeOverride === undefined ? (
      <RouterNavLink
        aria-disabled={isBusy || undefined}
        caseSensitive={caseSensitive}
        className={classNameFor}
        end={end}
        prefetch={prefetch}
        {...props}
      >
        {content}
      </RouterNavLink>
    ) : (
      <RouterLink
        aria-disabled={isBusy || undefined}
        className={classNameFor({ isActive: activeOverride, isPending: false })}
        prefetch={prefetch}
        {...toLinkProps({ isActive: activeOverride, props })}
      >
        {content}
      </RouterLink>
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
