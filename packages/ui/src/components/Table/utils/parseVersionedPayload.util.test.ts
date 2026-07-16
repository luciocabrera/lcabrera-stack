import { describe, expect, it } from 'vitest';

import { parseVersionedPayload } from './parseVersionedPayload.util';
import { PERSISTENCE_VERSION } from './persistence.constants';

type EncodePayloadArgs = {
  readonly value: unknown;
  readonly version: number;
};

const encodePayload = ({ value, version }: EncodePayloadArgs) =>
  encodeURIComponent(JSON.stringify({ value, version }));

describe('parseVersionedPayload', () => {
  it('returns the value when the version matches', () => {
    const rawValue = encodePayload({
      value: { isSettingsOpen: true },
      version: PERSISTENCE_VERSION,
    });

    expect(
      parseVersionedPayload<{ isSettingsOpen: boolean }>({ rawValue }),
    ).toEqual({ isSettingsOpen: true });
  });

  it('returns undefined on a version mismatch', () => {
    const rawValue = encodePayload({
      value: { stale: true },
      version: PERSISTENCE_VERSION + 1,
    });

    expect(parseVersionedPayload({ rawValue })).toBeUndefined();
  });

  it('returns undefined for invalid JSON', () => {
    expect(parseVersionedPayload({ rawValue: 'not-json{' })).toBeUndefined();
  });

  it('returns undefined for a malformed URI encoding', () => {
    expect(parseVersionedPayload({ rawValue: '%E0%A4%A' })).toBeUndefined();
  });
});
