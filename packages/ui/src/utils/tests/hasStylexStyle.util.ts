/**
 * Answers whether a rendered element carries every atomic class a StyleX style compiles to.
 * A style that compiles to no class is never reported as applied.
 */

import type { StyleXStyles } from '@stylexjs/stylex';

import * as stylex from '@stylexjs/stylex';

type HasStylexStyleArgs = {
  readonly element: Element;
  readonly style: StyleXStyles | undefined;
};

export const hasStylexStyle = ({ element, style }: HasStylexStyleArgs) => {
  const classNames = (stylex.props(style).className ?? '')
    .split(' ')
    .filter(Boolean);

  return (
    classNames.length > 0 &&
    classNames.every((name) => element.classList.contains(name))
  );
};
