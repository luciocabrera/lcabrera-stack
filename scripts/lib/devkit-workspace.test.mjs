/*
 * What the created-workspace gate decides from a tree it has already run.
 */

import { describe, expect, it } from 'vite-plus/test';

import {
  commandLabel,
  commitHookFindings,
  hooksPathFindings,
  missingBlueprintFiles,
  missingToolchainBins,
  modifiedTrackedFiles,
  nodeFindings,
  outputTail,
  taskFindings,
  tasksAddedByUpgrade,
  TOOLCHAIN_BINS,
  trackedPathsIn,
  trackedWritesByUpgrade,
  TREE_TASKS,
} from './devkit-workspace.mjs';

describe('TREE_TASKS', () => {
  it('runs the check-only tasks, then the writing lint:all last', () => {
    expect(TREE_TASKS).toEqual([
      ['run', 'lint:check'],
      ['run', 'typecheck:all'],
      ['fmt', '--check', '.'],
      ['run', 'test:all'],
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

describe('missingToolchainBins', () => {
  it('expects the kit and the gate the commit hook calls', () => {
    expect(TOOLCHAIN_BINS).toContain('devkit');
    expect(TOOLCHAIN_BINS).toContain('repo-verify-commit');
  });

  it('finds nothing when every expected bin was installed', () => {
    expect(
      missingToolchainBins({
        expected: TOOLCHAIN_BINS,
        present: [...TOOLCHAIN_BINS, 'vp'],
      }),
    ).toEqual([]);
  });

  it('names each bin the install did not put in place', () => {
    const findings = missingToolchainBins({
      expected: ['devkit', 'repo-verify-commit'],
      present: ['devkit'],
    });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('node_modules/.bin/repo-verify-commit');
  });
});

describe('tasksAddedByUpgrade', () => {
  it('finds nothing when the upgrade left the task block as it was', () => {
    const scripts = { 'commit:verify': 'repo-verify-commit' };
    expect(tasksAddedByUpgrade({ after: scripts, before: scripts })).toEqual(
      [],
    );
  });

  it('names each task the upgrade added', () => {
    const findings = tasksAddedByUpgrade({
      after: { 'commit:verify': 'repo-verify-commit', check: 'vp check' },
      before: { check: 'vp check' },
    });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('`commit:verify`');
  });
});

describe('commitHookFindings', () => {
  it('finds nothing when the hook takes the good message and refuses the bad one', () => {
    expect(
      commitHookFindings({
        accepted: { output: '', status: 0 },
        refused: { output: 'not Conventional', status: 1 },
      }),
    ).toEqual([]);
  });

  it('reports a refused Conventional Commit with what the hook said', () => {
    const findings = commitHookFindings({
      accepted: { output: 'repo-verify-commit is missing', status: 1 },
      refused: { output: '', status: 1 },
    });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('repo-verify-commit is missing');
  });

  it('reports a malformed message the hook let through', () => {
    const findings = commitHookFindings({
      accepted: { output: '', status: 0 },
      refused: { output: '', status: 0 },
    });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('accepted a message');
  });
});

describe('trackedPathsIn', () => {
  it('reads each path out of porcelain status lines', () => {
    expect(trackedPathsIn(' M package.json\n D biome.jsonc\n')).toEqual([
      'package.json',
      'biome.jsonc',
    ]);
  });
});

describe('trackedWritesByUpgrade', () => {
  it('finds nothing when the upgrade left every tracked file as it found it', () => {
    const snapshot = { 'vite.config.ts': 'abc' };
    expect(
      trackedWritesByUpgrade({ after: snapshot, before: snapshot }),
    ).toEqual([]);
  });

  it('names the upgrade for a file it dirtied', () => {
    const findings = trackedWritesByUpgrade({
      after: { 'devkit.config.json': 'def' },
      before: {},
    });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('`devkit init --upgrade`');
    expect(findings[0]).toContain('`devkit.config.json`');
  });

  it('names the upgrade for a file a task had dirtied and it rewrote again', () => {
    const findings = trackedWritesByUpgrade({
      after: { 'vite.config.ts': 'def' },
      before: { 'vite.config.ts': 'abc' },
    });
    expect(findings).toHaveLength(1);
  });

  it('names the upgrade for a file it put back to what was committed', () => {
    expect(
      trackedWritesByUpgrade({ after: {}, before: { 'biome.jsonc': 'abc' } }),
    ).toHaveLength(1);
  });
});

describe('hooksPathFindings', () => {
  it('finds nothing when git points at the hooks the tree ships', () => {
    expect(
      hooksPathFindings({
        actual: '.githooks',
        expected: '.githooks',
        step: 'vp install',
      }),
    ).toEqual([]);
  });

  it('reports an unset core.hooksPath and the step that left it so', () => {
    const findings = hooksPathFindings({
      actual: '',
      expected: '.githooks',
      step: 'vp install',
    });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('after `vp install`');
    expect(findings[0]).toContain('is unset');
  });

  it('reports a core.hooksPath pointing somewhere else', () => {
    const findings = hooksPathFindings({
      actual: '.husky',
      expected: '.githooks',
      step: 'devkit create',
    });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('is `.husky`');
  });
});
