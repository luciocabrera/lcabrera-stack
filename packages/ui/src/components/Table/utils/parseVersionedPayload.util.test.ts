import { describe, expect, it } from 'vitest';

import { PERSISTENCE_VERSION } from './persistence.constants';
import { parseVersionedPayload } from './parseVersionedPayload.util';

const encodePayload = (value: unknown, version: number) =>
  encodeURIComponent(JSON.stringify({ value, version }));

describe('parseVersionedPayload', () => {
  it('returns the value when the version matches', () => {
    const rawValue = encodePayload(
      { isSettingsOpen: true },
      PERSISTENCE_VERSION,
    );

    expect(
      parseVersionedPayload<{ isSettingsOpen: boolean }>({ rawValue }),
    ).toEqual({ isSettingsOpen: true });
  });

  it('returns undefined on a version mismatch', () => {
    const rawValue = encodePayload({ stale: true }, PERSISTENCE_VERSION + 1);

    expect(parseVersionedPayload({ rawValue })).toBeUndefined();
  });

  it('returns undefined for invalid JSON', () => {
    expect(parseVersionedPayload({ rawValue: 'not-json{' })).toBeUndefined();
  });

  it('returns undefined for a malformed URI encoding', () => {
    expect(parseVersionedPayload({ rawValue: '%E0%A4%A' })).toBeUndefined();
  });
});
