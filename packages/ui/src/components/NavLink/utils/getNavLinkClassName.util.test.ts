import { describe, expect, it } from 'vite-plus/test';

import { linkItemStyles } from '../NavLink.stylex';
import { getClassName } from './getClassName.util';
import { getInlineClassName } from './getInlineClassName.util';
import { getNavLinkClassName } from './getNavLinkClassName.util';

const STATE = {
  isActive: true,
  isBusy: false,
  isIconOnly: false,
  isPending: false,
  orientation: 'vertical',
  size: 'sm',
} as const;

describe('getNavLinkClassName', () => {
  it('uses the inline class names for the inline variant', () => {
    expect(getNavLinkClassName({ ...STATE, variant: 'inline' })).toBe(
      getInlineClassName({
        isActive: true,
        isBusy: false,
        isPending: false,
        styles: linkItemStyles,
      }),
    );
  });

  it('uses the button class names for any other variant', () => {
    expect(getNavLinkClassName({ ...STATE, variant: 'primary' })).toBe(
      getClassName({
        isActive: true,
        isBusy: false,
        isIconOnly: false,
        orientation: 'vertical',
        size: 'sm',
        styles: linkItemStyles,
        variant: 'primary',
      }),
    );
  });

  it('tells the active inline link from the idle one', () => {
    expect(getNavLinkClassName({ ...STATE, variant: 'inline' })).not.toBe(
      getNavLinkClassName({ ...STATE, isActive: false, variant: 'inline' }),
    );
  });
});
