import { describe, expect, it } from 'vite-plus/test';

import { resolveDrillShortfallText } from './resolveDrillShortfallText.util';

describe('resolveDrillShortfallText', () => {
  it('states the number and nothing else on screen', () => {
    // The cell has one line at a fixed row height and a column that can be
    // narrow, so the visible text spends its width on the number.
    expect(resolveDrillShortfallText(214).plain).toBe('214 more rows');
  });

  it('says where the link goes in its accessible name', () => {
    // "214 more rows" as a link announces a number and no destination.
    expect(resolveDrillShortfallText(214).linked).toContain('ungrouped');
  });

  it('singularises one row, in both spellings', () => {
    const { linked, plain } = resolveDrillShortfallText(1);

    expect(plain).toBe('1 more row');
    expect(linked).toContain('1 row of this group');
  });
});
