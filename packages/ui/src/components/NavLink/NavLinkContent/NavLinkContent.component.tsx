import * as stylex from '@stylexjs/stylex';

import type { NavLinkContentProps } from './NavLinkContent.types';

import { linkItemStyles } from '../NavLink.stylex';

export const NavLinkContent = ({
  children,
  icon,
  isBusy,
  isIconOnly,
  isInline,
}: NavLinkContentProps) => (
  <>
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
  </>
);
