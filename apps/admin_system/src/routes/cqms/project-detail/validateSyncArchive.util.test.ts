import { describe, expect, it } from 'vitest';

import { validateSyncArchive } from './validateSyncArchive.util';

const makeArchive = ({ name = 'repo.zip', sizeBytes = 1024 } = {}) =>
  new File([new Uint8Array(sizeBytes)], name, { type: 'application/zip' });

describe('validateSyncArchive', () => {
  it('accepts a non-empty .zip and narrows it to the File', () => {
    const archive = makeArchive();

    const result = validateSyncArchive({ archive });

    expect(result).toEqual({ archive, ok: true });
  });

  it('accepts a .ZIP regardless of case', () => {
    const result = validateSyncArchive({
      archive: makeArchive({ name: 'R.ZIP' }),
    });

    expect(result.ok).toBe(true);
  });

  it('rejects a missing entry', () => {
    // Exactly what the action passes when the field was never posted.
    const missing = new FormData().get('archive');

    expect(validateSyncArchive({ archive: missing })).toEqual({
      error: 'Pick a .zip archive of the repository to upload.',
      ok: false,
    });
  });

  it('rejects a non-File form value, such as a plain text field', () => {
    expect(validateSyncArchive({ archive: 'repo.zip' }).ok).toBe(false);
  });

  it('rejects an empty file', () => {
    const result = validateSyncArchive({
      archive: makeArchive({ sizeBytes: 0 }),
    });

    expect(result).toEqual({
      error: 'Pick a .zip archive of the repository to upload.',
      ok: false,
    });
  });

  it('rejects a non-zip extension', () => {
    const result = validateSyncArchive({
      archive: makeArchive({ name: 'repo.tar.gz' }),
    });

    expect(result).toEqual({
      error: 'Only .zip archives are supported.',
      ok: false,
    });
  });

  it('rejects an archive over the browser-upload cap and points at the CLI', () => {
    const result = validateSyncArchive({
      archive: makeArchive({ sizeBytes: 200 * 1024 * 1024 + 1 }),
    });

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toContain('use the CLI push');
  });
});
