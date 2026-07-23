import { describe, expect, it } from 'vite-plus/test';

import { buildGitChildEnv } from './buildGitChildEnv.util.ts';

describe('buildGitChildEnv', () => {
  it.each([
    'GIT_ALTERNATE_OBJECT_DIRECTORIES',
    'GIT_COMMON_DIR',
    'GIT_DIR',
    'GIT_INDEX_FILE',
    'GIT_NAMESPACE',
    'GIT_OBJECT_DIRECTORY',
    'GIT_WORK_TREE',
  ])('drops %s, which would outrank cwd', (name) => {
    const result = buildGitChildEnv({ env: { [name]: '/somewhere/.git' } });

    expect(Object.hasOwn(result, name)).toBe(false);
  });

  it('keeps the rest of the environment', () => {
    // The counterpart to the test above: git needs HOME to find global config
    // (where safe.directory lives) and the locale variables for its output, so
    // a denylist that quietly became an allowlist would be its own bug.
    const result = buildGitChildEnv({
      env: { GIT_DIR: '/somewhere/.git', HOME: '/home/user', LANG: 'C.UTF-8' },
    });

    expect(result).toMatchObject({ HOME: '/home/user', LANG: 'C.UTF-8' });
  });

  it('pins PATH to trusted system directories', () => {
    const result = buildGitChildEnv({ env: { PATH: '/tmp/evil:/usr/bin' } });

    expect(result.PATH).toBe('/usr/local/bin:/usr/bin:/bin');
  });

  it('keeps the search-bounding git variables, which cannot redirect a lookup', () => {
    const result = buildGitChildEnv({
      env: { GIT_CEILING_DIRECTORIES: '/home', GIT_EDITOR: 'true' },
    });

    expect(result).toMatchObject({
      GIT_CEILING_DIRECTORIES: '/home',
      GIT_EDITOR: 'true',
    });
  });

  it('does not mutate the environment it was given', () => {
    const env = { GIT_DIR: '/somewhere/.git', PATH: '/tmp/evil' };

    buildGitChildEnv({ env });

    expect(env).toEqual({ GIT_DIR: '/somewhere/.git', PATH: '/tmp/evil' });
  });
});
