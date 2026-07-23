import { describe, expect, it } from 'vite-plus/test';

import { validatePushArchive } from './validatePushArchive.util';

const MAX = 1024;

describe('validatePushArchive', () => {
  it('accepts an archive within the limit', () => {
    expect(validatePushArchive({ byteLength: 512, maxBytes: MAX })).toEqual({
      ok: true,
    });
  });

  it('rejects an empty body as 400 rather than an oversize 413', () => {
    expect(validatePushArchive({ byteLength: 0, maxBytes: MAX })).toEqual({
      error: 'Empty request body — expected a .zip archive.',
      ok: false,
      status: 400,
    });
  });

  it('rejects an oversize archive as 413, naming the limit', () => {
    expect(validatePushArchive({ byteLength: MAX + 1, maxBytes: MAX })).toEqual(
      {
        error: 'Archive exceeds the 1024-byte push limit.',
        ok: false,
        status: 413,
      },
    );
  });

  it('accepts an archive exactly at the limit', () => {
    // The check is `>`, not `>=` — the limit itself is allowed.
    expect(validatePushArchive({ byteLength: MAX, maxBytes: MAX })).toEqual({
      ok: true,
    });
  });
});
