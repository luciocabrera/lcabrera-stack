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
    // The spelling a `vp run devkit:doctor -- --profile` typo produces, and the
    // one that used to degrade silently: read as "absent", it means "use the
    // configured profile", so `doctor --check --profile` checked the narrower
    // set and exited 0 over a tree it was asked to look at more widely.
    expect(readProfileFlag(['--check', '--profile'])).toEqual({
      error: PROFILE_FLAG_ERROR,
      rest: ['--check', '--profile'],
    });
  });

  test('refuses a flag-shaped value rather than consuming it', () => {
    // Consuming it would be worse than either: `--profile --check` would run
    // against a profile called `--check` and turn the check off in the same
    // stroke.
    expect(readProfileFlag(['--profile', '--check'])).toEqual({
      error: PROFILE_FLAG_ERROR,
      rest: ['--profile', '--check'],
    });
  });

  test('leaves an unknown name to the config, which knows the vocabulary', () => {
    // Reading the argv is not where a profile is validated — `withProfile` is,
    // once, for the flag and the config file alike.
    expect(readProfileFlag(['--profile', 'agnet'])).toEqual({
      profile: 'agnet',
      rest: [],
    });
  });
});
