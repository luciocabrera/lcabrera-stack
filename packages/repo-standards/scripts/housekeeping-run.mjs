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
import { dockerFor } from './housekeeping-containers.mjs';
import { countMatches, parseStatusV2 } from './housekeeping-content.mjs';
import {
  buildPlan,
  parseWorktrees,
  parseWorktreeState,
  renderHint,
  summarizePrs,
} from './housekeeping-plan.mjs';
import { renderPlan } from './housekeeping-render.mjs';

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

const SHARED_REF_NAMESPACES = ['refs/heads/', 'refs/tags/', 'refs/remotes/'];

const refsContaining = ({ head, path }) =>
  head === ''
    ? []
    : gitLines({
        args: [
          'for-each-ref',
          '--format=%(refname)',
          '--contains',
          head,
          ...SHARED_REF_NAMESPACES,
        ],
        cwd: path,
      });

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

const unreadableFact = ({ counts, worktree }) =>
  worktree.head === '' ? 'its HEAD' : counts?.unreadable;

const withStatus = ({ base, worktree }) => {
  const output = runGit({
    args: ['status', '--porcelain=v2', '-z', '--untracked-files=normal'],
    cwd: worktree.path,
  });
  if (output === undefined) {
    return { ...worktree, dirty: true, unreadable: 'git status', untracked: 0 };
  }
  const status = parseStatusV2(output);
  const isDirty = status.changes.length > 0 || status.untracked > 0;
  const headRefs =
    isDirty && worktree.branch === undefined ? refsContaining(worktree) : [];
  const counts = isDirty ? contentOf({ base, status, worktree }) : undefined;
  return {
    ...worktree,
    counts,
    dirty: isDirty,
    headRefs,
    isHeadReferenced: headRefs.length > 0,
    onBase: isOnBase({ base, ...worktree }),
    unreadable: unreadableFact({ counts, worktree }),
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

const applyPlan = ({ docker, plan, root }) => {
  const failures = [];
  for (const worktree of plan.removeWorktrees) {
    failures.push(...applyWorktree({ root, worktree }));
  }
  if (runGit({ args: ['worktree', 'prune'], cwd: root }) === undefined) {
    failures.push('git worktree prune');
  }
  for (const branch of plan.deleteBranches) {
    if (
      runGit({ args: ['branch', '-D', branch.name], cwd: root }) === undefined
    ) {
      failures.push(`branch ${branch.name}`);
    }
  }
  for (const container of plan.removeContainers) {
    if (!docker.remove(container.id).ok) {
      failures.push(`container ${container.name}`);
    }
  }
  return failures;
};

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

const thresholdOf = (raw) => (/^\d{1,9}$/u.test(raw) ? Number(raw) : undefined);

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
  const threshold =
    index === -1 ? DEFAULT_THRESHOLD : thresholdOf(argv[index + 1] ?? '');
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
 * @param {{ argv: string[], docker?: { list: () => object,
 *   remove: (id: string) => { ok: boolean } }, pullRequests: object[],
 *   root: string }} args
 * @returns {{ code: number, lines: string[], errors: string[] }}
 */
export const runPrune = ({
  argv,
  docker = dockerFor(),
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
