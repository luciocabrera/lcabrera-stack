import { describe, expect, it } from 'vitest';

import { resolvePushSourceLabel } from './resolvePushSourceLabel.util';

describe('resolvePushSourceLabel', () => {
  it('labels the push with the reporting host', () => {
    expect(resolvePushSourceLabel({ host: 'ada-laptop' })).toBe(
      'cli:ada-laptop',
    );
  });

  it('degrades to cli:unknown when the header is absent', () => {
    // Sourced from a real Headers rather than a null literal: this is exactly
    // how the action obtains it, and .get() returning null is the whole case.
    const host = new Headers().get('X-CodePulse-Host');

    expect(resolvePushSourceLabel({ host })).toBe('cli:unknown');
  });

  it('keeps an empty header value distinguishable from a missing one', () => {
    expect(resolvePushSourceLabel({ host: '' })).toBe('cli:');
  });
});
