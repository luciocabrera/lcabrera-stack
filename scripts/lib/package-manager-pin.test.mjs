/*
 * The three outcomes a refresh can leave the `packageManager` pin in (#927).
 *
 * The middle one is the reason this file exists: corepack can exit non-zero
 * having already completed its write, so a caller that trusts the exit code
 * reports the opposite of what happened. Each case here is named for the tool
 * that produced it, because the tools are what a reader has to reason about.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  describePinOutcome,
  hasIntegrityHash,
  parsePackageManagerPin,
} from './package-manager-pin.mjs';

const BARE = 'pnpm@11.23.0';
const HASHED =
  'pnpm@11.23.0+sha256.78dcbf44f40cef50d1f4b535ca9961a30edb4b13c420c360bf4068d424a41bc4';
const PREVIOUS =
  'pnpm@11.22.0+sha256.11aa11bb22cc33dd44ee55ff66007788990011223344556677889900aabbccddee';

describe('parsePackageManagerPin', () => {
  it('splits a hashed pin into name, version and digest', () => {
    expect(parsePackageManagerPin(HASHED)).toEqual({
      algorithm: 'sha256',
      digest:
        '78dcbf44f40cef50d1f4b535ca9961a30edb4b13c420c360bf4068d424a41bc4',
      name: 'pnpm',
      version: '11.23.0',
    });
  });

  it('reports a bare pin as parsed but unhashed, not as malformed', () => {
    expect(parsePackageManagerPin(BARE)).toEqual({
      algorithm: null,
      digest: null,
      name: 'pnpm',
      version: '11.23.0',
    });
  });

  it('returns null for a value that is not a pin', () => {
    expect(parsePackageManagerPin('pnpm')).toBeNull();
    expect(parsePackageManagerPin('')).toBeNull();
    expect(parsePackageManagerPin(undefined)).toBeNull();
  });
});

describe('hasIntegrityHash', () => {
  it('separates what corepack writes from what taze writes', () => {
    expect(hasIntegrityHash(HASHED)).toBe(true);
    expect(hasIntegrityHash(BARE)).toBe(false);
  });
});

describe('describePinOutcome', () => {
  it('reports a clean corepack write as a move', () => {
    const outcome = describePinOutcome({ after: HASHED, before: PREVIOUS });

    expect(outcome.level).toBe('ok');
    expect(outcome.message).toContain('moved');
  });

  it('says the pin moved even though corepack exited non-zero', () => {
    const outcome = describePinOutcome({
      after: HASHED,
      before: PREVIOUS,
      corepackFailed: true,
    });

    expect(outcome.level).toBe('warn');
    expect(outcome.message).toContain('had already written');
    expect(outcome.message).toContain(HASHED);
  });

  it('errors when corepack died before its write and left taze bare version', () => {
    const outcome = describePinOutcome({
      after: BARE,
      before: PREVIOUS,
      corepackFailed: true,
    });

    expect(outcome.level).toBe('error');
    expect(outcome.message).toContain('no integrity hash');
  });

  it('errors on a missing hash even when corepack reported success', () => {
    const outcome = describePinOutcome({ after: BARE, before: PREVIOUS });

    expect(outcome.level).toBe('error');
  });
});
