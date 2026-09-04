/**
 * Reads the two harness signals that live outside this machine's transcripts:
 * workflow runs from the GitHub API, and register activity from git history.
 *
 * Each reader reports its availability separately from its findings, because an
 * unauthenticated `gh`, an unreachable API and a workflow nobody triggered all
 * produce no runs. Each takes the whole window rather than its start alone,
 * since a store keeps growing after the day a report is dated. The git day is
 * re-checked after parsing, and the log prints the committer date the revision
 * filter itself selects on, so the check cannot discard a commit git chose.
 */
const workflowRunCount = ({ file, runGh, window }) => {
  try {
    const total = runGh([
      'api',
      '-X',
      'GET',
      `repos/{owner}/{repo}/actions/workflows/${file}/runs`,
      '-f',
      `created=${window.start}..${window.end}`,
      '-f',
      'per_page=1',
      '--jq',
      '.total_count',
    ]);
    const parsed = Number.parseInt(total, 10);
    return Number.isNaN(parsed)
      ? { reason: `unreadable run total for ${file}` }
      : { count: parsed };
  } catch (error) {
    return { reason: error.message };
  }
};

export const readWorkflowRuns = ({ runGh, window, workflows }) => {
  try {
    runGh(['api', 'repos/{owner}/{repo}', '--jq', '.full_name']);
  } catch (error) {
    return { available: false, reason: error.message, runs: {} };
  }
  return {
    available: true,
    runs: Object.fromEntries(
      workflows.map((file) => [
        file,
        workflowRunCount({ file, runGh, window }),
      ]),
    ),
  };
};

const RECORD_MARK = String.fromCodePoint(1);

export const parseCommitFiles = (log) =>
  log
    .split(RECORD_MARK)
    .map((record) => record.trim())
    .filter((record) => record.length > 0)
    .map((record) => {
      const lines = record.split('\n');
      return {
        day: (lines[0] ?? '').split(' ')[1] ?? '',
        files: lines.slice(1).filter((line) => line.length > 0),
      };
    });

export const tallyFiles = (commits) => {
  const tally = {};
  for (const commit of commits) {
    for (const file of new Set(commit.files)) {
      const previous = tally[file];
      tally[file] = {
        commits: (previous?.commits ?? 0) + 1,
        lastTouched:
          previous === undefined || commit.day > previous.lastTouched
            ? commit.day
            : previous.lastTouched,
      };
    }
  }
  return tally;
};

export const withinWindow = ({ commits, window }) =>
  commits.filter(
    (commit) => commit.day >= window.start && commit.day <= window.end,
  );

export const readRegisterActivity = ({ cwd, directory, runGit, window }) => {
  const log = runGit({
    args: [
      'log',
      `--since=${window.start}T00:00:00Z`,
      `--until=${window.end}T23:59:59Z`,
      '--name-only',
      '--date=short',
      '--pretty=format:%x01%H %cd',
      '--',
      directory,
    ],
    cwd,
  });
  if (log === undefined) {
    return {
      available: false,
      files: {},
      reason: `git log over ${directory} could not be read — git is unavailable, or this is not a work tree`,
    };
  }
  const commits = withinWindow({ commits: parseCommitFiles(log), window });
  return {
    available: true,
    commits: commits.length,
    files: tallyFiles(commits),
    lastActivity: commits.reduce(
      (latest, commit) =>
        latest === undefined || commit.day > latest ? commit.day : latest,
      undefined,
    ),
  };
};

export const isShallowClone = ({ cwd, runGit }) =>
  runGit({ args: ['rev-parse', '--is-shallow-repository'], cwd }) === 'true';
