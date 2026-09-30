/*
 * What the created-workspace gate decides from a tree it has already run.
 */

import { describe, expect, it } from 'vite-plus/test';

import {
  missingBlueprintFiles,
  nodeFindings,
  outputTail,
  taskFindings,
  TREE_TASKS,
} from './devkit-workspace.mjs';

describe('TREE_TASKS', () => {
  it('runs the four tasks the created tree wires for itself', () => {
    expect(TREE_TASKS.map(({ label }) => label)).toEqual([
      'vp run lint:all',
      'vp run typecheck:all',
      'vp fmt --check .',
      'vp run test:all',
    ]);
  });
});

describe('nodeFindings', () => {
  const tree = { band: '>=26 <27', pinned: '26.10.0' };

  it('accepts a runtime inside the band', () => {
    expect(nodeFindings({ ...tree, running: '26.3.1' })).toEqual([]);
  });

  it('names the pin when the runtime is outside the band', () => {
    const [finding] = nodeFindings({ ...tree, running: '24.1.0' });
    expect(finding).toContain('26.10.0');
    expect(finding).toContain('24.1.0');
    expect(finding).toContain('.node-version');
  });

  it('reports a tree that names no runtime at all', () => {
    expect(
      nodeFindings({ band: undefined, pinned: '26.10.0', running: '26.10.0' }),
    ).toEqual([expect.stringContaining('no `engines.node` band')]);
    expect(
      nodeFindings({ band: '>=26 <27', pinned: undefined, running: '26.10.0' }),
    ).toHaveLength(1);
  });
});

describe('taskFindings', () => {
  it('reports nothing for a zero exit', () => {
    expect(
      taskFindings({ label: 'vp run lint:all', output: 'noise', status: 0 }),
    ).toEqual([]);
  });

  it('carries the label, the status and the output for a failure', () => {
    const [finding] = taskFindings({
      label: 'vp run lint:all',
      output: 'lint/style/noEnum\n',
      status: 1,
    });
    expect(finding).toContain('`vp run lint:all` exited 1');
    expect(finding).toContain('lint/style/noEnum');
  });

  it('reports a process killed by a signal as a failure', () => {
    expect(
      taskFindings({ label: 'vp install', output: '', status: null }),
    ).toEqual([expect.stringContaining('exited on a signal')]);
  });
});

describe('outputTail', () => {
  it('keeps the last lines and drops blank ones', () => {
    const output = Array.from(
      { length: 100 },
      (_, index) => `line ${index}\n`,
    ).join('\n');
    const tail = outputTail(output).split('\n');
    expect(tail.at(-1)).toBe('line 99');
    expect(tail).not.toContain('line 0');
    expect(tail).not.toContain('');
  });

  it('says so when there is no output', () => {
    expect(outputTail('\n \n')).toBe('no output');
  });
});

describe('missingBlueprintFiles', () => {
  const targetOf = (path) => (path === 'gitignore' ? '.gitignore' : path);

  it('accepts a tree holding every blueprint file under its target name', () => {
    expect(
      missingBlueprintFiles({
        blueprint: ['gitignore', 'biome.jsonc'],
        placed: ['.gitignore', 'biome.jsonc', 'COMMANDS.md'],
        targetOf,
      }),
    ).toEqual([]);
  });

  it('reports a blueprint file the tree lacks', () => {
    expect(
      missingBlueprintFiles({
        blueprint: ['gitignore', 'biome.jsonc'],
        placed: ['.gitignore'],
        targetOf,
      }),
    ).toEqual([expect.stringContaining('`biome.jsonc`')]);
  });

  it('does not accept a file placed under its source name when it ships renamed', () => {
    expect(
      missingBlueprintFiles({
        blueprint: ['gitignore'],
        placed: ['gitignore'],
        targetOf,
      }),
    ).toHaveLength(1);
  });
});
