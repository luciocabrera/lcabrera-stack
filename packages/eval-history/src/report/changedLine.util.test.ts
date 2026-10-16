import { describe, expect, it } from 'vite-plus/test';

import { changedLine } from './changedLine.util.ts';

describe('changedLine', () => {
  it('says when no input hash changed', () => {
    expect(changedLine({ kind: 'none' })).toContain('no input hash');
  });

  it('names a single changed hash as the one cause', () => {
    expect(changedLine({ changed: 'catalog', kind: 'single' })).toBe(
      'Changed: skill catalog hash. That is one cause.',
    );
  });

  it('lists several changed hashes as multiple causes', () => {
    expect(
      changedLine({ changed: ['catalog', 'harness'], kind: 'multiple' }),
    ).toContain(
      'Changed: skill catalog hash, harness version. That is multiple causes',
    );
  });
});
