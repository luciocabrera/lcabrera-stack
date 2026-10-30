// @vitest-environment jsdom

import * as stylex from '@stylexjs/stylex';
import { describe, expect, it } from 'vite-plus/test';

import { styles } from '#ui/components/Text/Text.stylex';

import { hasStylexStyle } from './hasStylexStyle.util';

const elementWith = (className: string) => {
  const element = document.createElement('span');

  element.className = className;

  return element;
};

describe('hasStylexStyle', () => {
  it('reports a style whose every class the element carries', () => {
    const element = elementWith(
      stylex.props(styles.text, styles.size.sm).className ?? '',
    );

    expect(hasStylexStyle({ element, style: styles.size.sm })).toBe(true);
  });

  it('rejects a style the element carries only part of', () => {
    const [first = ''] = (stylex.props(styles.text).className ?? '').split(
      ' ',
      1,
    );

    expect(
      hasStylexStyle({ element: elementWith(first), style: styles.text }),
    ).toBe(false);
  });

  it('rejects a style the element does not carry', () => {
    const element = elementWith(stylex.props(styles.size.sm).className ?? '');

    expect(hasStylexStyle({ element, style: styles.size.lg })).toBe(false);
  });

  it('rejects a style that compiles to no class', () => {
    const element = elementWith(stylex.props(styles.text).className ?? '');

    expect(stylex.props(undefined).className).toBeUndefined();
    expect(hasStylexStyle({ element, style: undefined })).toBe(false);
  });
});
