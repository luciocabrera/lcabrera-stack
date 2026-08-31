import { describe, expect, test } from 'vite-plus/test';

import { PROFILE_FLAG_ERROR, readProfileFlag } from './profile-flag.mjs';

describe('readProfileFlag', () => {
  test('reads the name and takes both arguments out of the rest', () => {
    expect(readProfileFlag(['--check', '--profile', 'full', 'extra'])).toEqual({
      profile: 'full',
      rest: ['--check', 'extra'],
    });
  });

  test('an absent flag means the configured profile, and leaves argv alone', () => {
    expect(readProfileFlag(['--check'])).toEqual({ rest: ['--check'] });
  });

  test('refuses the flag with nothing after it', () => {
    expect(readProfileFlag(['--check', '--profile'])).toEqual({
      error: PROFILE_FLAG_ERROR,
      rest: ['--check', '--profile'],
    });
  });

  test('refuses a flag-shaped value rather than consuming it', () => {
    expect(readProfileFlag(['--profile', '--check'])).toEqual({
      error: PROFILE_FLAG_ERROR,
      rest: ['--profile', '--check'],
    });
  });

  test('leaves an unknown name to the config, which knows the vocabulary', () => {
    expect(readProfileFlag(['--profile', 'agnet'])).toEqual({
      profile: 'agnet',
      rest: [],
    });
  });
});
