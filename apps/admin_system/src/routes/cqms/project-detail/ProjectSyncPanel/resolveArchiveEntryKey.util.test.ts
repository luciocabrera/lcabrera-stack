import { describe, expect, it } from 'vite-plus/test';

import { resolveArchiveEntryKey } from './resolveArchiveEntryKey.util';

describe('resolveArchiveEntryKey', () => {
  it('strips the leading picked-folder segment to a repo-root-relative key', () => {
    expect(resolveArchiveEntryKey('my-repo/src/index.ts')).toBe('src/index.ts');
  });

  it('handles a file directly under the picked folder', () => {
    expect(resolveArchiveEntryKey('my-repo/package.json')).toBe('package.json');
  });

  it('preserves deeply nested paths below the root', () => {
    expect(
      resolveArchiveEntryKey('my-repo/apps/admin_system/src/root.tsx'),
    ).toBe('apps/admin_system/src/root.tsx');
  });

  it('returns a separator-less path unchanged (defensive)', () => {
    expect(resolveArchiveEntryKey('lonely.ts')).toBe('lonely.ts');
  });

  it('keeps dotfiles and dotted names intact', () => {
    expect(resolveArchiveEntryKey('my-repo/.env.example')).toBe('.env.example');
  });
});
