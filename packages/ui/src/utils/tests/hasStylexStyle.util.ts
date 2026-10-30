/**
 * Answers whether a rendered element carries every atomic class a StyleX style compiles to.
 */

import type { StyleXStyles } from '@stylexjs/stylex';

import * as stylex from '@stylexjs/stylex';

type HasStylexStyleArgs = {
  readonly element: Element;
  readonly style: StyleXStyles;
};

export const hasStylexStyle = ({ element, style }: HasStylexStyleArgs) =>
  (stylex.props(style).className ?? '')
    .split(' ')
    .filter(Boolean)
    .every((name) => element.classList.contains(name));
