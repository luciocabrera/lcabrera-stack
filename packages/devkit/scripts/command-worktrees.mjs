/*
 * The `worktrees` command: sort every linked worktree into remove or keep,
 * print that plan, and with `--apply` carry out exactly that plan.
 *
 * `--hint` is the read-only count a session-start hook runs. It reads local
 * refs only, so it makes no network call and stays fast however many
 * worktrees there are.
 */

import { existsSync, realpathSync } from 'node:fs';

import { runGit, runGitRaw } from './git-exec.mjs';
import {
  countMatches,
  gitSucceeds,
  isOnBase,
  parseStatus,
  parseWorktreeList,
  resolveBase,
} from './worktree-git.mjs';
import { countWorktreeHint, renderHint } from './worktree-hint.mjs';
import { systemHosts } from './worktree-hosts.mjs';
import {
  planContainers,
  planWorktrees,
  PR_STATES,
  renderPlan,
} from './worktree-plan.mjs';

const git = (args, cwd) => runGit({ args, cwd });

const DEFAULT_THRESHOLD = 10;

const BOOLEAN_FLAGS = new Set(['--apply', '--hint', '--include-superseded']);
const VALUE_FLAGS = new Set(['--base', '--threshold']);

const isValue = (value) => value !== undefined && !value.startsWith('-');

const readFlags = (argv) => {
  const flags = {};
  let index = 0;
  while (index < argv.length && flags.error === undefined) {
    const entry = argv[index] ?? '';
    const value = argv[index + 1];
    if (BOOLEAN_FLAGS.has(entry)) {
      flags[entry] = true;
      index += 1;
    } else if (VALUE_FLAGS.has(entry) && isValue(value)) {
      flags[entry] = value;
      index += 2;
    } else {
      flags.error = `devkit worktrees: unexpected argument ${entry}`;
    }
  }
  return flags;
};

const thresholdOf = (value) => {
  if (value === undefined) return DEFAULT_THRESHOLD;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
};

const realPath = (path) => {
  try {
    return realpathSync(path);
  } catch {
    return path;
  }
};

const upstreamOf = ({ branch, path }) =>
  branch === undefined
    ? ''
    : git(
        ['for-each-ref', '--format=%(upstream)', `refs/heads/${branch}`],
        path,
      );

const ownRefs = (entry) =>
  [entry.head, upstreamOf(entry)].filter((ref) => ref !== '');

const NOT_ASKED = { reason: 'not asked', state: PR_STATES.unknown };

const needsPullRequest = ({ counts, entry, isClean, onBase, untracked }) => {
  if (entry.locked) return false;
  return isClean
    ? entry.branch !== undefined || !onBase
    : entry.branch !== undefined && counts.neither === 0 && untracked === 0;
};

const gatherOne = ({ base, entry, pullRequests }) => {
  const status = parseStatus(
    runGitRaw({
      args: ['status', '--porcelain=v1', '-z', '--untracked-files=normal'],
      cwd: entry.path,
    }),
  );
  const isClean = status.changes.length === 0 && status.untracked === 0;
  const onBase = isOnBase({ base, commit: entry.head, cwd: entry.path, git });
  const counts = isClean
    ? undefined
    : countMatches({
        base,
        changes: status.changes,
        cwd: entry.path,
        git,
        own: ownRefs(entry),
      });
  const shared = {
    ...entry,
    clean: isClean,
    counts,
    onBase,
    untracked: status.untracked,
  };
  return {
    ...shared,
    pr: needsPullRequest({ ...shared, entry, isClean })
      ? pullRequests(entry)
      : NOT_ASKED,
  };
};

const linkedWorktrees = (root) => {
  const here = realPath(git(['rev-parse', '--show-toplevel'], root));
  const entries = parseWorktreeList(
    git(['worktree', 'list', '--porcelain'], root),
  );
  const linked = entries.filter(
    (entry) => !entry.isMain && !entry.bare && realPath(entry.path) !== here,
  );
  return {
    linked: linked.filter((entry) => !entry.prunable),
    main: entries.find((entry) => entry.isMain)?.path ?? root,
    prunable: linked
      .filter((entry) => entry.prunable)
      .map((entry) => entry.path),
  };
};

const baseBranchOf = (base) => base.replace(/^[^/]+\//u, '');

const unknownReasons = (facts) => [
  ...new Set(
    facts
      .filter(
        (entry) =>
          entry.pr.state === PR_STATES.unknown && entry.pr !== NOT_ASKED,
      )
      .map(
        (entry) => `kept what needs a pull request state: ${entry.pr.reason}`,
      ),
  ),
];

const buildPlan = ({ base, flags, hosts, root }) => {
  const { linked, main, prunable } = linkedWorktrees(root);
  const pullRequests = hosts.pullRequests(main);
  const facts = linked.map((entry) => gatherOne({ base, entry, pullRequests }));
  const listed = hosts.containers(main);
  return {
    apply: flags['--apply'] === true,
    containers: planContainers({
      containers: listed.containers,
      isOnDisk: existsSync,
      live: new Set(linked.map((entry) => entry.path)),
    }),
    main,
    notes: [
      ...unknownReasons(facts),
      ...(listed.error === undefined
        ? []
        : [`no containers checked: ${listed.error}`]),
    ],
    prunable,
    worktrees: planWorktrees({
      facts,
      options: {
        base,
        baseBranch: baseBranchOf(base),
        includeSuperseded: flags['--include-superseded'] === true,
      },
    }),
  };
};

const attempt = (label, step) => {
  try {
    step();
    return [];
  } catch (error) {
    return [
      `${label}: ${error instanceof Error ? error.message : String(error)}`,
    ];
  }
};

const applyWorktree = ({ entry, main }) => {
  const removal = attempt(`remove ${entry.path}`, () =>
    git(
      ['worktree', 'remove', ...(entry.force ? ['--force'] : []), entry.path],
      main,
    ),
  );
  return removal.length > 0 || !entry.deleteBranch
    ? removal
    : attempt(`delete branch ${entry.branch}`, () =>
        git(['branch', '-D', entry.branch], main),
      );
};

const applyContainer = ({ entry, hosts, main }) => {
  const result = hosts.removeContainer({ cwd: main, id: entry.id });
  return result.ok ? [] : [`remove container ${entry.name}: ${result.reason}`];
};

const applyPlan = ({ hosts, plan }) => [
  ...plan.worktrees
    .filter((entry) => entry.action === 'remove')
    .flatMap((entry) => applyWorktree({ entry, main: plan.main })),
  ...attempt('git worktree prune', () => git(['worktree', 'prune'], plan.main)),
  ...plan.containers
    .filter((entry) => entry.action === 'remove')
    .flatMap((entry) => applyContainer({ entry, hosts, main: plan.main })),
];

const hintCount = ({ base, root }) => {
  try {
    return countWorktreeHint({ base, git, root });
  } catch {
    return 0;
  }
};

const runHint = ({ flags, root }) => {
  const threshold = thresholdOf(flags['--threshold']);
  if (threshold === undefined) {
    console.error('devkit worktrees: --threshold needs a whole number');
    return 1;
  }
  const line = renderHint({
    count: hintCount({ base: flags['--base'], root }),
    threshold,
  });
  if (line !== undefined) console.log(line);
  return 0;
};

const runPlan = ({ flags, hosts, root }) => {
  if (!gitSucceeds({ args: ['rev-parse', '--git-dir'], cwd: root, git })) {
    console.error('devkit worktrees: not inside a git repository');
    return 1;
  }
  const base = resolveBase({ base: flags['--base'], cwd: root, git });
  if (base === undefined) {
    console.error(
      'devkit worktrees: no default branch found — pass --base <ref>',
    );
    return 1;
  }
  const plan = buildPlan({ base, flags, hosts, root });
  console.log(renderPlan(plan).join('\n'));
  if (!plan.apply) return 0;
  const failures = applyPlan({ hosts, plan });
  for (const failure of failures) console.error(`failed: ${failure}`);
  return failures.length === 0 ? 0 : 1;
};

/**
 * @param {{ argv: string[], hosts: object, root: string }} args
 */
export const runWorktreesWith = ({ argv, hosts, root }) => {
  const flags = readFlags(argv);
  if (flags.error !== undefined) {
    console.error(flags.error);
    return 1;
  }
  return flags['--hint'] === true
    ? runHint({ flags, root })
    : runPlan({ flags, hosts, root });
};

export const runWorktrees = (argv, root) =>
  runWorktreesWith({ argv, hosts: systemHosts(), root });
