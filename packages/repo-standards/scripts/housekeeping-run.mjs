/**
 * What `housekeeping:prune` does once its arguments and pull request data are
 * in hand: gather git state, print the plan, and with `--apply` carry it out.
 * Separate from the bin so a test can run it against a scratch repository with
 * its own pull request list and container engine. `--hint` reads local refs
 * only and never touches the code host or the container engine.
 */
import { existsSync, realpathSync } from 'node:fs';

import { readConventions } from './config.mjs';
import { runGit, runGitStatus } from './git-exec.mjs';
import {
  dockerBinary,
  listThrowawayContainers,
  removeContainer,
} from './housekeeping-containers.mjs';
import { countMatches, parseStatusV2 } from './housekeeping-content.mjs';
import {
  buildPlan,
  parseWorktrees,
  parseWorktreeState,
  renderHint,
  summarizePrs,
} from './housekeeping-plan.mjs';

const DEFAULT_THRESHOLD = 10;

const realPath = (path) => {
  try {
    return realpathSync(path);
  } catch {
    return path;
  }
};

const gitLines = ({ args, cwd }) =>
  (runGit({ args, cwd }) ?? '').split('\n').filter(Boolean);

const doesGitSucceed = ({ args, cwd }) =>
  runGitStatus({ args, cwd }).status === 0;

const resolveBase = (root) => {
  const branch = readConventions(root).defaultBranch;
  return [`origin/${branch}`, branch].find((ref) =>
    doesGitSucceed({
      args: ['rev-parse', '--verify', '--quiet', ref],
      cwd: root,
    }),
  );
};

const isOnBase = ({ base, head, path }) =>
  base !== undefined &&
  head !== '' &&
  doesGitSucceed({
    args: ['merge-base', '--is-ancestor', head, base],
    cwd: path,
  });

const upstreamOf = ({ branch, path }) =>
  branch === undefined
    ? ''
    : (runGit({
        args: ['for-each-ref', '--format=%(upstream)', `refs/heads/${branch}`],
        cwd: path,
      }) ?? '');

const isResolvable = ({ cwd, ref }) =>
  ref !== '' &&
  doesGitSucceed({ args: ['rev-parse', '--verify', '--quiet', ref], cwd });

const contentOf = ({ base, status, worktree }) =>
  base === undefined
    ? undefined
    : countMatches({
        base,
        changes: status.changes,
        cwd: worktree.path,
        git: runGitStatus,
        own: [worktree.head, upstreamOf(worktree)].filter((ref) =>
          isResolvable({ cwd: worktree.path, ref }),
        ),
      });

const withStatus = ({ base, worktree }) => {
  const status = parseStatusV2(
    runGit({
      args: ['status', '--porcelain=v2', '-z', '--untracked-files=normal'],
      cwd: worktree.path,
    }) ?? '',
  );
  const isDirty = status.changes.length > 0 || status.untracked > 0;
  return {
    ...worktree,
    counts: isDirty ? contentOf({ base, status, worktree }) : undefined,
    dirty: isDirty,
    onBase: isOnBase({ base, ...worktree }),
    untracked: status.untracked,
  };
};

const listWorktrees = (root) => {
  const porcelain = runGit({
    args: ['worktree', 'list', '--porcelain'],
    cwd: root,
  });
  const state = parseWorktreeState(porcelain);
  const here = realPath(root);
  const all = parseWorktrees(porcelain).map((worktree) => ({
    ...worktree,
    head: '',
    locked: false,
    prunable: false,
    ...state.get(worktree.path),
  }));
  return {
    live: all.filter(
      (worktree) =>
        !worktree.prunable &&
        (worktree.isPrimary || realPath(worktree.path) !== here),
    ),
    prunable: all.filter((worktree) => worktree.prunable),
  };
};

const uniqueCountsByBranch = ({ base, branches, root }) =>
  new Map(
    branches.map((branch) => {
      const out =
        base === undefined
          ? undefined
          : runGit({
              args: ['rev-list', '--count', `${base}..${branch}`],
              cwd: root,
            });
      return [branch, out === undefined ? undefined : Number(out)];
    }),
  );

const prVerdictsByHead = (pullRequests) => {
  const grouped = Map.groupBy(pullRequests, (pr) => pr.headRefName);
  return new Map([...grouped].map(([head, prs]) => [head, summarizePrs(prs)]));
};

const planNotes = ({ base, listed, pullRequests }) => [
  ...(pullRequests.length === 0
    ? [
        'no pull request data on stdin (is gh installed and signed in?) — every worktree that needs it is kept',
      ]
    : []),
  ...(listed.error === undefined
    ? []
    : [`no containers checked: ${listed.error}`]),
  ...(base === undefined
    ? ['no default branch found — content and ancestry checks skipped']
    : []),
];

const gatherPlan = ({ docker, flags, pullRequests, root }) => {
  const base = resolveBase(root);
  const { live, prunable } = listWorktrees(root);
  const worktrees = live.map((worktree) =>
    worktree.isPrimary
      ? { ...worktree, dirty: false }
      : withStatus({ base, worktree }),
  );
  const branches = gitLines({
    args: ['branch', '--format=%(refname:short)'],
    cwd: root,
  });
  const listed = docker.list();
  const plan = buildPlan({
    branches,
    checkedOutBranches: new Set(worktrees.map((w) => w.branch).filter(Boolean)),
    containers: listed.containers,
    currentBranch:
      runGit({ args: ['branch', '--show-current'], cwd: root }) || undefined,
    hasPrData: pullRequests.length > 0,
    includeSuperseded: flags.includeSuperseded,
    isOnDisk: existsSync,
    keep: new Set(),
    prByHead: prVerdictsByHead(pullRequests),
    stashes: gitLines({ args: ['stash', 'list'], cwd: root }),
    uniqueByBranch: uniqueCountsByBranch({ base, branches, root }),
    worktrees,
  });
  return {
    ...plan,
    notes: planNotes({ base, listed, pullRequests }),
    prunable: prunable.map((w) => w.path),
  };
};

const section = ({ rows, title }) => [
  `\n${title}`,
  ...(rows.length === 0 ? ['  (none)'] : rows.map((row) => `  ${row}`)),
];

const renderPlan = ({ apply, plan }) => {
  const verb = (doing, would) => (apply ? doing : would);
  return [
    apply
      ? 'housekeeping:prune — applying'
      : 'housekeeping:prune — dry run (pass --apply to act)',
    ...section({
      rows: plan.deleteBranches.map((b) => `${b.name} — ${b.reason}`),
      title: `${verb('Deleting', 'Would delete')} branches (merged/closed PR or cruft):`,
    }),
    ...section({
      rows: plan.removeWorktrees.map(
        (w) => `${w.path} [${w.branch ?? 'detached'}] — ${w.reason}`,
      ),
      title: `${verb('Removing', 'Would remove')} worktrees:`,
    }),
    ...section({
      rows: plan.prunable.map((path) => `${path} — its directory is gone`),
      title: `${verb('Pruning', 'Would prune')} stale worktree entries (\`git worktree prune\`, before any branch is deleted):`,
    }),
    ...section({
      rows: plan.removeContainers.map((c) => `${c.name} — ${c.reason}`),
      title: `${verb('Removing', 'Would remove')} throwaway containers:`,
    }),
    ...section({
      rows: [
        ...plan.reportBranches.map((b) => `branch ${b.name} — ${b.reason}`),
        ...plan.reportWorktrees.map((w) => `worktree ${w.path} — ${w.reason}`),
        ...plan.keepContainers.map((c) => `container ${c.name} — ${c.reason}`),
        ...plan.stashes.map((s) => `stash ${s}`),
      ],
      title: 'KEEPING — review by hand, never auto-deleted:',
    }),
    ...plan.notes.map((note) => `note: ${note}`),
  ];
};

const applyWorktree = ({ root, worktree }) =>
  runGit({
    args: [
      'worktree',
      'remove',
      ...(worktree.force ? ['--force'] : []),
      worktree.path,
    ],
    cwd: root,
  }) === undefined
    ? [`worktree ${worktree.path}`]
    : [];

const applyPlan = ({ docker, plan, root }) => [
  ...plan.removeWorktrees.flatMap((worktree) =>
    applyWorktree({ root, worktree }),
  ),
  ...(runGit({ args: ['worktree', 'prune'], cwd: root }) === undefined
    ? ['git worktree prune']
    : []),
  ...plan.deleteBranches
    .filter(
      (branch) =>
        runGit({ args: ['branch', '-D', branch.name], cwd: root }) ===
        undefined,
    )
    .map((branch) => `branch ${branch.name}`),
  ...plan.removeContainers
    .filter((container) => !docker.remove(container.id).ok)
    .map((container) => `container ${container.name}`),
];

const goneBranches = (root) =>
  new Set(
    gitLines({
      args: [
        'for-each-ref',
        '--format=%(refname:short)%00%(upstream:track)',
        'refs/heads',
      ],
      cwd: root,
    })
      .map((line) => line.split('\0'))
      .filter(([, track]) => track === '[gone]')
      .map(([name]) => name),
  );

const isClean = (path) =>
  runGitStatus({
    args: ['status', '--porcelain', '--untracked-files=normal'],
    cwd: path,
  }).stdout === '';

const countRemovableHint = (root) => {
  if (!doesGitSucceed({ args: ['rev-parse', '--git-dir'], cwd: root }))
    return 0;
  const base = resolveBase(root);
  const gone = goneBranches(root);
  return listWorktrees(root)
    .live.filter((worktree) => !worktree.isPrimary && !worktree.locked)
    .filter((worktree) =>
      worktree.branch === undefined
        ? isOnBase({ base, ...worktree })
        : gone.has(worktree.branch),
    )
    .filter((worktree) => isClean(worktree.path)).length;
};

const thresholdOf = (raw) => {
  if (raw === undefined) return DEFAULT_THRESHOLD;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
};

const adviceOf = (argv) => {
  const index = argv.indexOf('--advice');
  const text = argv[index + 1] ?? '';
  return {
    isGiven: index !== -1,
    text: text.startsWith('--') ? '' : text.trim(),
  };
};

/**
 * @param {{ argv: string[], root: string }} args
 * @returns {{ code: number, lines: string[], errors: string[] }}
 */
export const runHint = ({ argv, root }) => {
  const index = argv.indexOf('--threshold');
  const threshold = thresholdOf(index === -1 ? undefined : argv[index + 1]);
  if (threshold === undefined) {
    return { code: 1, errors: ['--threshold needs a whole number'], lines: [] };
  }
  const advice = adviceOf(argv);
  if (advice.isGiven && advice.text === '') {
    return { code: 1, errors: ['--advice needs a text after it'], lines: [] };
  }
  const line = renderHint({
    ...(advice.isGiven && { advice: advice.text }),
    count: countRemovableHint(root),
    threshold,
  });
  return { code: 0, errors: [], lines: line === undefined ? [] : [line] };
};

/**
 * @param {string[]} [directories]
 */
export const dockerHost = (directories) => {
  const binary = dockerBinary(directories);
  return {
    list: () => listThrowawayContainers(binary),
    remove: (id) => removeContainer({ binary, id }),
  };
};

/**
 * @param {{ argv: string[], docker?: { list: () => object,
 *   remove: (id: string) => { ok: boolean } }, pullRequests: object[],
 *   root: string }} args
 * @returns {{ code: number, lines: string[], errors: string[] }}
 */
export const runPrune = ({
  argv,
  docker = dockerHost(),
  pullRequests,
  root,
}) => {
  const flags = {
    apply: argv.includes('--apply'),
    includeSuperseded: argv.includes('--include-superseded'),
  };
  const plan = gatherPlan({ docker, flags, pullRequests, root });
  const lines = renderPlan({ apply: flags.apply, plan });
  if (!flags.apply) return { code: 0, errors: [], lines };
  const failures = applyPlan({ docker, plan, root });
  return {
    code: failures.length === 0 ? 0 : 1,
    errors:
      failures.length === 0
        ? []
        : [
            `${failures.length} operation(s) failed:`,
            ...failures.map((f) => `  ${f}`),
          ],
    lines,
  };
};
