import { createElement } from 'react';
import { describe, expect, it } from 'vite-plus/test';

import { getIsNativeInteractiveElement } from './getIsNativeInteractiveElement.util';

const NoopComponent = () => 'noop';

describe('getIsNativeInteractiveElement', () => {
  it.each(['a', 'button', 'input', 'select', 'summary', 'textarea'])(
    'returns true for native interactive tag %s',
    (tag) => {
      expect(getIsNativeInteractiveElement(createElement(tag))).toBe(true);
    },
  );

  it.each(['span', 'div', 'p'])(
    'returns false for non-interactive tag %s',
    (tag) => {
      expect(getIsNativeInteractiveElement(createElement(tag))).toBe(false);
    },
  );

  it('returns false for custom component elements', () => {
    expect(getIsNativeInteractiveElement(createElement(NoopComponent))).toBe(
      false,
    );
  });

  it('returns false for plain text nodes', () => {
    expect(getIsNativeInteractiveElement('button')).toBe(false);
  });

  it('returns false for empty nodes', () => {
    expect(getIsNativeInteractiveElement(undefined)).toBe(false);
    expect(getIsNativeInteractiveElement(false)).toBe(false);
  });
});
