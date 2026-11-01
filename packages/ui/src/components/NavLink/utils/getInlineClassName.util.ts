import type { StyleXStyles } from '@stylexjs/stylex';

import * as stylex from '@stylexjs/stylex';

import type { linkItemStyles } from '../NavLink.stylex';

type GetInlineClassNameArgs = {
  readonly customStylex?: StyleXStyles;
  readonly isActive: boolean;
  readonly isBusy?: boolean;
  readonly isPending: boolean;
  readonly styles: typeof linkItemStyles;
};

export const getInlineClassName = ({
  customStylex,
  isActive,
  isBusy = false,
  isPending,
  styles,
}: GetInlineClassNameArgs) =>
  stylex.props(
    styles.inline.link,
    isActive && styles.inline.active,
    isPending && styles.inline.pending,
    isBusy && styles.busyLink,
    customStylex,
  ).className ?? '';
