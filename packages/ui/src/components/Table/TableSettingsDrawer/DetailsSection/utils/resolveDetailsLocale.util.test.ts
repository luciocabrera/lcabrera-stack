// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveDetailsLocale } from './resolveDetailsLocale.util';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('resolveDetailsLocale', () => {
  it('returns the explicit locale when one is provided', () => {
    expect(resolveDetailsLocale('fr-FR')).toBe('fr-FR');
  });

  it('falls back to the browser locale when no locale is given', () => {
    vi.stubGlobal('navigator', { language: 'es-ES' });

    expect(resolveDetailsLocale(undefined)).toBe('es-ES');
  });

  it('returns undefined when there is no locale and no navigator', () => {
    vi.stubGlobal('navigator', undefined);

    expect(resolveDetailsLocale(undefined)).toBeUndefined();
  });
});
