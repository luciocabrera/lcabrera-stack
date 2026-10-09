import { describe, expect, it } from 'vite-plus/test';

import { versionLabel } from './versionLabel.util.ts';

describe('versionLabel', () => {
  it('prints a version as JSON, so a string stays quoted', () => {
    expect([versionLabel(0), versionLabel('1')]).toEqual(['0', '"1"']);
  });

  it('says missing when there is no version', () => {
    expect(versionLabel(undefined)).toBe('missing');
  });
});
