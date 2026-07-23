// @vitest-environment jsdom

import { describe, expect, it } from 'vite-plus/test';

import { applyWebkitDirectory } from './applyWebkitDirectory.util';

describe('applyWebkitDirectory', () => {
  it('sets the webkitdirectory attribute on the input node', () => {
    const input = document.createElement('input');
    applyWebkitDirectory(input);
    expect(input.hasAttribute('webkitdirectory')).toBe(true);
    expect(input.getAttribute('webkitdirectory')).toBe('');
  });

  it('is a no-op for a null node (ref detach on unmount)', () => {
    // querySelector returns a genuine null when nothing matches — the value a
    // React ref callback receives on unmount, without a null literal.
    const detached = document.querySelector<HTMLInputElement>('#absent');
    expect(() => {
      applyWebkitDirectory(detached);
    }).not.toThrow();
  });
});
