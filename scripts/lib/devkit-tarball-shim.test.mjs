/*
 * What the packed `create-lcabrera-stack` initializer has to leave behind.
 *
 * Split from `devkit-tarball.test.mjs` for size: the decisions are the same
 * module's, and the shim is the only one of the three distributed packages
 * whose whole job is the tree it produces.
 */

import { describe, expect, it } from 'vite-plus/test';

import { createShimFindings } from './devkit-tarball.mjs';

describe('createShimFindings', () => {
  const good = {
    commitSubject: 'chore: initialise the repository with devkit',
    isRepository: true,
    status: '',
    tracked: ['devkit.config.json', '.devkit-manifest.json'],
  };

  it('accepts a repository that was made, filled and committed', () => {
    expect(createShimFindings(good)).toEqual([]);
  });

  it('reports a run that left no repository, and says nothing else about it', () => {
    expect(createShimFindings({ ...good, isRepository: false })).toEqual([
      expect.stringContaining('left no git repository'),
    ]);
  });

  it('reports a repository with no commit', () => {
    expect(
      createShimFindings({ ...good, commitSubject: '' }).join('\n'),
    ).toContain('no commit');
  });

  it('reports a run that committed no config, which is a profile that placed nothing', () => {
    expect(createShimFindings({ ...good, tracked: [] }).join('\n')).toContain(
      'placed nothing',
    );
  });

  it('reports anything left uncommitted, naming the first path', () => {
    expect(
      createShimFindings({ ...good, status: '?? stray.txt' }).join('\n'),
    ).toContain('stray.txt');
  });
});
