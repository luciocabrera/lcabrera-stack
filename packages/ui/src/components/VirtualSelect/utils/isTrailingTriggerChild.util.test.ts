import { describe, expect, it } from 'vite-plus/test';

import { isTrailingTriggerChild } from './isTrailingTriggerChild.util';

const makeChild = (dataset: Record<string, string>) =>
  ({ dataset }) as unknown as HTMLElement;

describe('isTrailingTriggerChild', () => {
  it('treats a valueless data-chevron or data-overflow as trailing', () => {
    expect(isTrailingTriggerChild(makeChild({ chevron: '' }))).toBe(true);
    expect(isTrailingTriggerChild(makeChild({ overflow: '' }))).toBe(true);
  });

  it('treats a tag as not trailing', () => {
    expect(isTrailingTriggerChild(makeChild({}))).toBe(false);
  });
});
