import type { NavLinkProps, NavLinkRenderProps } from 'react-router';

type ToLinkPropsArgs = {
  readonly isActive: boolean;
  readonly props: Omit<NavLinkProps, 'caseSensitive' | 'children' | 'end'>;
};

export const toLinkProps = ({
  isActive,
  props: { 'aria-current': ariaCurrent = 'page', className, style, ...rest },
}: ToLinkPropsArgs) => {
  const state: NavLinkRenderProps = {
    isActive,
    isPending: false,
    isTransitioning: false,
  };

  return {
    ...rest,
    'aria-current': isActive ? ariaCurrent : undefined,
    ...(className !== undefined && {
      className: typeof className === 'function' ? className(state) : className,
    }),
    ...(style !== undefined && {
      style: typeof style === 'function' ? style(state) : style,
    }),
  };
};
