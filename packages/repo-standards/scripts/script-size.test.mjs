import { describe, expect, it } from 'vite-plus/test';

import {
  ALWAYS_SKIPPED,
  baselineFor,
  baselineWarning,
  countCodeLines,
  findingsFor,
  isToolingScript,
  sizeProblem,
} from './script-size.mjs';

const CEILING = 350;

describe('countCodeLines', () => {
  it('counts logic and not prose, so a thorough header is free', () => {
    const content = [
      '/**',
      ' * A header explaining why this file exists.',
      ' */',
      '',
      'const a = 1;',
      '// a trailing thought',
      'const b = 2;',
    ].join('\n');

    expect(countCodeLines(content)).toBe(2);
  });

  it('counts a line whose comment follows code', () => {
    expect(countCodeLines('const a = 1; // why')).toBe(1);
  });
});

describe('ALWAYS_SKIPPED', () => {
  it('holds the directory whose omission turns the gate into a hang', () => {
    expect(ALWAYS_SKIPPED).toContain('node_modules');
  });
});

describe('sizeProblem', () => {
  it('says nothing about a file within the ceiling', () => {
    expect(
      sizeProblem({
        ceiling: CEILING,
        file: 'a.mjs',
        grandfathered: undefined,
        lines: 350,
      }),
    ).toBeUndefined();
  });

  it('reports a non-baselined file against the ceiling', () => {
    expect(
      sizeProblem({
        ceiling: CEILING,
        file: 'a.mjs',
        grandfathered: undefined,
        lines: 351,
      }),
    ).toContain('exceeds the 350 ceiling');
  });

  it('holds a baselined file to its recorded size, not to the ceiling', () => {
    const args = { ceiling: CEILING, file: 'a.mjs', grandfathered: 500 };

    expect(sizeProblem({ ...args, lines: 500 })).toBeUndefined();
    expect(sizeProblem({ ...args, lines: 501 })).toContain(
      "it grew. Shrink it, don't raise the baseline",
    );
  });
});

describe('baselineWarning', () => {
  it('says nothing about a file that was never baselined', () => {
    expect(
      baselineWarning({
        ceiling: CEILING,
        file: 'a.mjs',
        grandfathered: undefined,
        lines: 10,
      }),
    ).toBeUndefined();
  });

  it('asks for the entry to be dropped once the file is under the ceiling', () => {
    expect(
      baselineWarning({
        ceiling: CEILING,
        file: 'a.mjs',
        grandfathered: 500,
        lines: 300,
      }),
    ).toContain('remove its baseline entry');
  });

  it('asks for a ratchet when it shrank but is still over', () => {
    expect(
      baselineWarning({
        ceiling: CEILING,
        file: 'a.mjs',
        grandfathered: 500,
        lines: 400,
      }),
    ).toContain('ratchet down');
  });

  it('says nothing while a baselined file is unchanged', () => {
    expect(
      baselineWarning({
        ceiling: CEILING,
        file: 'a.mjs',
        grandfathered: 500,
        lines: 500,
      }),
    ).toBeUndefined();
  });
});

describe('baselineFor', () => {
  it('records only what is over the ceiling, at the size it is now', () => {
    const baseline = baselineFor({
      ceiling: CEILING,
      measured: [
        { file: 'big.mjs', lines: 400 },
        { file: 'small.mjs', lines: 10 },
      ],
    });

    expect(baseline).toEqual({ 'big.mjs': 400 });
  });

  it('orders by name so the diff a reviewer reads is stable', () => {
    const baseline = baselineFor({
      ceiling: CEILING,
      measured: [
        { file: 'z.mjs', lines: 900 },
        { file: 'a.mjs', lines: 400 },
      ],
    });

    expect(Object.keys(baseline)).toEqual(['a.mjs', 'z.mjs']);
  });
});

describe('findingsFor', () => {
  it('keeps the blocking findings apart from the advisory ones', () => {
    const { problems, warnings } = findingsFor({
      baseline: { 'shrank.mjs': 500 },
      ceiling: CEILING,
      measured: [
        { file: 'grew.mjs', lines: 400 },
        { file: 'shrank.mjs', lines: 360 },
        { file: 'fine.mjs', lines: 10 },
      ],
    });

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('grew.mjs');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('shrank.mjs');
  });
});

describe('isToolingScript', () => {
  it('counts a .mjs or .cjs wherever it sits', () => {
    expect(isToolingScript('vite.config.mjs')).toBe(true);
    expect(isToolingScript('packages/kit/hooks/pre-push.cjs')).toBe(true);
  });

  it('counts a .js, .ts, .mts or .cts under a scripts directory', () => {
    expect(isToolingScript('scripts/report.js')).toBe(true);
    expect(isToolingScript('packages/kit/scripts/verify-thing.ts')).toBe(true);
    expect(isToolingScript('scripts/lib/walk.mts')).toBe(true);
    expect(isToolingScript('scripts/lib/walk.cts')).toBe(true);
  });

  it('leaves source outside a scripts directory to the rules that govern it', () => {
    expect(isToolingScript('packages/ui/src/index.ts')).toBe(false);
    expect(isToolingScript('apps/showcase/app/root.tsx')).toBe(false);
    expect(isToolingScript('vite.config.ts')).toBe(false);
  });

  it('reads scripts as a directory segment, not as part of a name', () => {
    expect(isToolingScript('packages/kit/src/scripts.ts')).toBe(false);
    expect(isToolingScript('packages/kit/src/my-scripts/thing.ts')).toBe(false);
  });

  it('does not count a non-script file that happens to live there', () => {
    expect(isToolingScript('scripts/README.md')).toBe(false);
    expect(isToolingScript('scripts/departed-names.json')).toBe(false);
  });
});
