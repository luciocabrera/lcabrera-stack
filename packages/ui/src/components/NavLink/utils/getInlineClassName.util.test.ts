import type { StyleXStyles } from '@stylexjs/stylex';

import * as stylex from '@stylexjs/stylex';
import { describe, expect, it } from 'vite-plus/test';

import { linkItemStyles } from '../NavLink.stylex';
import { getInlineClassName } from './getInlineClassName.util';

const classesOf = (...styles: readonly StyleXStyles[]) =>
  (stylex.props(...styles).className ?? '').split(' ');

const getClasses = (
  args: Partial<Parameters<typeof getInlineClassName>[0]> = {},
) =>
  getInlineClassName({
    isActive: false,
    isPending: false,
    styles: linkItemStyles,
    ...args,
  }).split(' ');

describe('getInlineClassName', () => {
  it('applies only the inline link style when idle', () => {
    expect(getClasses()).toEqual(classesOf(linkItemStyles.inline.link));
  });

  it('adds the active style when the route is active', () => {
    expect(getClasses({ isActive: true })).toEqual(
      classesOf(linkItemStyles.inline.link, linkItemStyles.inline.active),
    );
  });

  it('adds the pending style while the navigation is pending', () => {
    expect(getClasses({ isPending: true })).toEqual(
      classesOf(linkItemStyles.inline.link, linkItemStyles.inline.pending),
    );
  });

  it('adds the busy style only when busy', () => {
    expect(getClasses({ isBusy: true })).toEqual(
      classesOf(linkItemStyles.inline.link, linkItemStyles.busyLink),
    );
    expect(getClasses({ isBusy: false })).toEqual(
      classesOf(linkItemStyles.inline.link),
    );
  });

  it('applies customStylex last', () => {
    expect(getClasses({ customStylex: linkItemStyles.labelHidden })).toEqual(
      classesOf(linkItemStyles.inline.link, linkItemStyles.labelHidden),
    );
  });

  it('never applies the button base styles', () => {
    expect(getClasses({ isActive: true })).not.toEqual(
      expect.arrayContaining(classesOf(linkItemStyles.active)),
    );
  });
});
