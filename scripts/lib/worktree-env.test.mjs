import { describe, expect, it } from 'vite-plus/test';

import {
  isEnvFileName,
  linkTextFor,
  parseArgs,
  summarize,
  TEMPLATE_SUFFIXES,
} from './worktree-env.mjs';

// The linker points a worktree's env paths at the primary checkout's files. Two
// ways that goes wrong silently: linking a TRACKED template (which would replace
// a real committed file with a pointer), and writing an absolute link target
// (which dangles the moment either checkout is moved). Both are asserted here.

describe('isEnvFileName', () => {
  it('accepts a bare .env and suffixed variants', () => {
    expect(isEnvFileName('.env')).toBe(true);
    expect(isEnvFileName('.env.local')).toBe(true);
    expect(isEnvFileName('.env.production.local')).toBe(true);
  });

  it('rejects every tracked template suffix', () => {
    for (const suffix of TEMPLATE_SUFFIXES) {
      expect(isEnvFileName(`.env${suffix}`)).toBe(false);
    }
  });

  it('rejects names that merely contain env', () => {
    expect(isEnvFileName('env')).toBe(false);
    expect(isEnvFileName('.environment')).toBe(false);
    expect(isEnvFileName('docker.env')).toBe(false);
  });

  // Only a TRAILING template suffix marks a template. `.env.example.bak` is a
  // stray backup of one, not a tracked template, so it is a real env file here.
  it('accepts a name whose template suffix is not the last one', () => {
    expect(isEnvFileName('.env.example.bak')).toBe(true);
  });
});

describe('linkTextFor', () => {
  it('is relative, so the link survives either tree moving', () => {
    const text = linkTextFor(
      '/repo/primary/docker/local/.env',
      '/repo/wt/docker/local/.env',
    );
    expect(text.startsWith('/')).toBe(false);
    expect(text).toBe('../../../primary/docker/local/.env');
  });

  it('resolves back to the source from the destination directory', () => {
    const source = '/repo/primary/.env';
    const destination = '/repo/worktrees/a/.env';
    expect(linkTextFor(source, destination)).toBe('../../primary/.env');
  });
});

describe('parseArgs', () => {
  it('defaults the target to the current directory', () => {
    expect(parseArgs([], '/repo/wt')).toEqual({
      target: '/repo/wt',
      dryRun: false,
    });
  });

  it('reads --target and --dry-run in any order', () => {
    expect(
      parseArgs(['--dry-run', '--target', '/repo/other'], '/repo/wt'),
    ).toEqual({
      target: '/repo/other',
      dryRun: true,
    });
  });

  it('falls back to the cwd when --target has no value', () => {
    expect(parseArgs(['--target'], '/repo/wt').target).toBe('/repo/wt');
  });

  // `--target --dry-run` must not resolve "--dry-run" as a path — that fails
  // later with a directory nobody typed, which is hard to read back to a typo.
  it('treats a flag-like value as no target at all', () => {
    expect(parseArgs(['--target', '--dry-run'], '/repo/wt')).toEqual({
      target: '/repo/wt',
      dryRun: true,
    });
  });
});

describe('summarize', () => {
  it('counts only what was not already present', () => {
    const results = [
      { relPath: 'a', status: 'linked' },
      { relPath: 'b', status: 'exists' },
      { relPath: 'c', status: 'linked' },
    ];
    expect(summarize(results, false, 'wt')).toBe(
      'Linked 2 of 3 env file(s) into wt',
    );
  });

  it('says "would" in dry-run so output is not mistaken for a real run', () => {
    expect(
      summarize([{ relPath: 'a', status: 'would-link' }], true, 'wt'),
    ).toBe('Would link 1 of 1 env file(s) into wt');
  });
});
