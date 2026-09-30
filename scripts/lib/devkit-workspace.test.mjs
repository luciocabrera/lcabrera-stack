/*
 * What the created-workspace gate decides from a tree it has already run.
 */

import { describe, expect, it } from 'vite-plus/test';

import {
  buildOutputFindings,
  commandLabel,
  missingBlueprintFiles,
  modifiedTrackedFiles,
  nodeFindings,
  outputTail,
  serveFindings,
  START_ARGS,
  taskFindings,
  TREE_TASKS,
} from './devkit-workspace.mjs';

describe('TREE_TASKS', () => {
  it('runs the check-only tasks, then the writing lint:all last', () => {
    expect(TREE_TASKS).toEqual([
      ['run', 'lint:check'],
      ['run', 'typecheck:all'],
      ['fmt', '--check', '.'],
      ['run', 'test:all'],
      ['run', 'build'],
      ['run', 'lint:all'],
    ]);
  });

  it('runs no writing task before a check it could mask', () => {
    const writing = new Set(['lint:all', '--fix', '--write']);
    const firstWriting = TREE_TASKS.findIndex((args) =>
      args.some((word) => writing.has(word)),
    );
    expect(firstWriting).toBe(TREE_TASKS.length - 1);
  });

  it('labels each task with the command it runs', () => {
    expect(TREE_TASKS.map((args) => commandLabel(args))).toEqual([
      'vp run lint:check',
      'vp run typecheck:all',
      'vp fmt --check .',
      'vp run test:all',
      'vp run build',
      'vp run lint:all',
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

  it('reports a process killed by a signal by naming the signal', () => {
    expect(
      taskFindings({
        label: 'vp install',
        output: '',
        signal: 'SIGKILL',
        status: null,
      }),
    ).toEqual([expect.stringContaining('was killed by SIGKILL')]);
  });

  it('reports a process that never ran by its spawn error, not as a signal', () => {
    const [finding] = taskFindings({
      error: 'spawnSync vp ENOENT',
      label: 'vp install',
      output: '',
      signal: null,
      status: null,
    });
    expect(finding).toContain('could not run (spawnSync vp ENOENT)');
    expect(finding).not.toContain('signal');
  });

  it('reports an error even when the process exited zero', () => {
    expect(
      taskFindings({
        error: 'spawnSync vp ENOBUFS',
        label: 'vp run test:all',
        output: '',
        signal: 'SIGTERM',
        status: 0,
      }),
    ).toEqual([
      expect.stringContaining('could not run (spawnSync vp ENOBUFS)'),
    ]);
  });
});

describe('modifiedTrackedFiles', () => {
  it('reports nothing for a clean tree', () => {
    expect(modifiedTrackedFiles('')).toEqual([]);
  });

  it('names each committed file a step changed', () => {
    const findings = modifiedTrackedFiles(
      ' M vite.config.ts\n M apps/web/src/root.tsx\n',
    );
    expect(findings).toHaveLength(2);
    expect(findings[0]).toContain(
      '`vite.config.ts` changed while the gate ran',
    );
    expect(findings[1]).toContain('`apps/web/src/root.tsx`');
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

describe('buildOutputFindings', () => {
  it('accepts a build that wrote the server entry', () => {
    expect(buildOutputFindings({ exists: true })).toEqual([]);
  });

  it('reports a build that wrote no server entry', () => {
    expect(buildOutputFindings({ exists: false })).toEqual([
      expect.stringContaining('apps/web/build/server/index.js'),
    ]);
  });
});

describe('serveFindings', () => {
  const url = 'http://127.0.0.1:4100/';

  it('serves the start task from the root', () => {
    expect(START_ARGS).toEqual(['run', 'start']);
  });

  it('accepts an HTTP 200', () => {
    expect(serveFindings({ output: '', status: 200, url })).toEqual([]);
  });

  it('reports any other status with the server output', () => {
    const [finding] = serveFindings({
      output: 'Error: boom\n',
      status: 500,
      url,
    });
    expect(finding).toContain('`vp run start`');
    expect(finding).toContain('answered HTTP 500');
    expect(finding).toContain('Error: boom');
  });

  it('reports a server that never answered by the reason', () => {
    const [finding] = serveFindings({
      error: 'the task exited 1 before answering',
      output: '',
      url,
    });
    expect(finding).toContain('never answered (the task exited 1');
    expect(finding).toContain(url);
  });
});
