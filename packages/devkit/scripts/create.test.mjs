import { describe, expect, test } from 'vite-plus/test';

import {
  CREATE_BRANCH,
  DEFAULT_COMMIT_IDENTITY,
  INITIAL_COMMIT_MESSAGE,
  ancestorsOf,
  commitIdentityArgs,
  createRefusal,
  createSummary,
  initialManifest,
  missingGitRefusal,
  packageNameFor,
  unfinishedNotice,
} from './create.mjs';

describe('createRefusal', () => {
  test('lets a fresh name through', () => {
    expect(createRefusal({ targets: ['demo'] })).toBeUndefined();
  });

  test('lets an existing but empty directory through', () => {
    expect(
      createRefusal({ targetEntries: [], targets: ['demo'] }),
    ).toBeUndefined();
  });

  test('refuses no target, naming init as the command for a repository that exists', () => {
    const refusal = createRefusal({ targets: [] });
    expect(refusal).toContain('devkit create <directory>');
    expect(refusal).toContain('devkit init');
  });

  test('refuses more than one target rather than picking one', () => {
    const refusal = createRefusal({ targets: ['one', 'two'] });
    expect(refusal).toContain('one target directory at a time');
    expect(refusal).toContain('one');
    expect(refusal).toContain('two');
  });

  test('refuses a non-empty target, naming what is in it and init as the alternative', () => {
    const refusal = createRefusal({
      targetEntries: ['src', 'README.md'],
      targets: ['demo'],
    });
    expect(refusal).toContain('is not empty');
    expect(refusal).toContain('README.md');
    expect(refusal).toContain('devkit init');
  });

  test('says what create actually allows, since an existing empty directory is fine', () => {
    const refusal = createRefusal({
      targetEntries: ['src'],
      targets: ['demo'],
    });
    expect(refusal).toContain('a directory with nothing in it');
    expect(refusal).not.toContain('a directory it made');
  });

  test('refuses a directory it cannot read, rather than guessing it is empty', () => {
    const refusal = createRefusal({
      targetIsReadable: false,
      targets: ['demo'],
    });
    expect(refusal).toContain('cannot be read');
    expect(refusal).toContain('permissions');
  });

  test('refuses a name a file already holds, without offering init on it', () => {
    const refusal = createRefusal({
      targetIsDirectory: false,
      targets: ['demo'],
    });
    expect(refusal).toContain('is not a directory');
    expect(refusal).not.toContain('devkit init');
  });

  test('refuses a target inside a repository, naming that repository', () => {
    const refusal = createRefusal({
      enclosingRepository: '/home/dev/stack',
      targets: ['packages/demo'],
    });
    expect(refusal).toContain('/home/dev/stack');
    expect(refusal).toContain('devkit init');
  });

  test('reports the nesting before the contents, since the outer repository is the reason either way', () => {
    expect(
      createRefusal({
        enclosingRepository: '/home/dev/stack',
        targetEntries: ['src'],
        targets: ['demo'],
      }),
    ).toContain('/home/dev/stack');
  });
});

describe('ancestorsOf', () => {
  test('walks to the root, nearest first, and stops there', () => {
    const walked = ancestorsOf('/home/dev/stack/demo');
    expect(walked.slice(0, 3)).toEqual([
      '/home/dev/stack/demo',
      '/home/dev/stack',
      '/home/dev',
    ]);
    expect(walked.at(-1)).toBe('/');
    expect(new Set(walked).size).toBe(walked.length);
  });

  test('a root is its own only ancestor, so the walk terminates', () => {
    expect(ancestorsOf('/')).toEqual(['/']);
  });
});

describe('packageNameFor', () => {
  test('keeps a name npm already accepts', () => {
    expect(packageNameFor('my-app')).toBe('my-app');
  });

  test('folds the characters npm refuses into separators', () => {
    expect(packageNameFor('My App!')).toBe('my-app');
    expect(packageNameFor('Demo_Project 2')).toBe('demo_project-2');
  });

  test('never answers with a name npm would reject outright', () => {
    expect(packageNameFor('...')).toBe('app');
    expect(packageNameFor('')).toBe('app');
    expect(packageNameFor('-leading-')).toBe('leading');
  });
});

describe('initialManifest', () => {
  test('starts private, so a first commit cannot publish anything', () => {
    expect(initialManifest({ name: 'demo' })).toEqual({
      name: 'demo',
      private: true,
      type: 'module',
      version: '0.0.0',
    });
  });
});

describe('commitIdentityArgs', () => {
  test('leaves a configured identity alone', () => {
    expect(
      commitIdentityArgs({ email: 'dev@example.com', name: 'Dev' }),
    ).toEqual([]);
  });

  test('supplies a placeholder when either half is missing, rather than failing the commit', () => {
    for (const identity of [
      undefined,
      {},
      { name: 'Dev' },
      { email: 'dev@example.com' },
    ]) {
      const args = commitIdentityArgs(identity);
      expect(args).toContain(`user.name=${DEFAULT_COMMIT_IDENTITY.name}`);
      expect(args).toContain(`user.email=${DEFAULT_COMMIT_IDENTITY.email}`);
    }
  });
});

describe('what a run says afterwards', () => {
  test('the summary names the branch and the directory', () => {
    const summary = createSummary({ branch: CREATE_BRANCH, target: 'demo' });
    expect(summary).toContain('demo');
    expect(summary).toContain(CREATE_BRANCH);
    expect(summary).toContain('devkit init --upgrade');
  });

  test('a machine without git is refused, naming where it looked', () => {
    const refusal = missingGitRefusal({ searched: ['/usr/local/bin', '/bin'] });
    expect(refusal).toContain('/usr/local/bin');
    expect(refusal).toContain('/bin');
    expect(refusal).toContain('install git');
  });

  test('a failed run says the directory is still there, rather than leaving it unexplained', () => {
    expect(unfinishedNotice({ target: 'demo' })).toContain('left in place');
  });

  test('the initial commit message is a conventional commit, since the kit ships that gate', () => {
    expect(INITIAL_COMMIT_MESSAGE).toMatch(/^[a-z]+(\([^)]+\))?: .+/);
  });
});
