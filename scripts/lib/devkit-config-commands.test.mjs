/*
 * What the created-workspace gate runs from a tree's command map.
 */

import { describe, expect, it } from 'vite-plus/test';

import { configuredCommandRuns } from './devkit-config-commands.mjs';

describe('configuredCommandRuns', () => {
  it('runs every configured command, in key order, labelled by its key', () => {
    expect(
      configuredCommandRuns({
        test: 'vp run test:all',
        audit: 'vp run deps:audit',
        run: 'vp run',
      }),
    ).toEqual({
      findings: [],
      runs: [
        {
          command: 'vp run deps:audit',
          label: 'commands.audit: vp run deps:audit',
        },
        { command: 'vp run', label: 'commands.run: vp run' },
        { command: 'vp run test:all', label: 'commands.test: vp run test:all' },
      ],
    });
  });

  it('reports a missing test or audit key rather than running nothing for it', () => {
    const { findings, runs } = configuredCommandRuns({ check: 'vp check' });
    expect(runs).toEqual([
      { command: 'vp check', label: 'commands.check: vp check' },
    ]);
    expect(findings).toHaveLength(2);
    expect(findings[0]).toContain('commands.audit');
    expect(findings[1]).toContain('commands.test');
  });

  it('reads a tree with no commands block as missing both keys', () => {
    expect(configuredCommandRuns().findings).toHaveLength(2);
    expect(configuredCommandRuns(undefined).runs).toEqual([]);
  });

  it('reads an empty or blank value as missing, since `sh -c` would pass it', () => {
    const { findings, runs } = configuredCommandRuns({
      audit: '   ',
      check: 'vp check',
      test: '',
    });
    expect(findings).toHaveLength(2);
    expect(findings[0]).toContain('commands.audit');
    expect(findings[1]).toContain('commands.test');
    expect(runs).toEqual([
      { command: 'vp check', label: 'commands.check: vp check' },
    ]);
  });
});
