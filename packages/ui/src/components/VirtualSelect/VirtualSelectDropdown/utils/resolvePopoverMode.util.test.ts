import { describe, expect, it } from 'vite-plus/test';

import { resolvePopoverMode } from './resolvePopoverMode.util';

describe('resolvePopoverMode', () => {
  it('promotes a floating list to a manual popover where the browser supports one', () => {
    expect(
      resolvePopoverMode({ hasPopoverSupport: true, isFloating: true }),
    ).toBe('manual');
  });

  it('leaves an inline list, or a browser without popovers, without the attribute', () => {
    expect(
      resolvePopoverMode({ hasPopoverSupport: true, isFloating: false }),
    ).toBeUndefined();
    expect(
      resolvePopoverMode({ hasPopoverSupport: false, isFloating: true }),
    ).toBeUndefined();
  });
});
