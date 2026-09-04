/**
 * Reads the two harness signals that live outside this machine's transcripts:
 * workflow runs from the GitHub API, and register activity from git history.
 *
 * Both stores already retain what is needed, which is the design constraint —
 * nothing here collects, so nothing here can drift from what actually happened.
 *
 * Every reader returns its availability separately from its findings. An
 * unauthenticated `gh`, an unreachable API and a workflow nobody has triggered
 * all produce no runs, and reporting that as a count would make the three
 * indistinguishable.
 *
 * Both readers take the whole window, not just its start. A store keeps growing
 * after the day a report is dated, so a query bounded below only answers with
 * everything that has happened since — which would print today's activity under
 * a window that ended weeks ago, and make `--now` unable to reproduce the run it
 * names. The git day is re-checked against the window after parsing, because the
 * day the report prints comes from the commit's own date field rather than from
 * the revision filter that selected it.
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
      '--pretty=format:%x01%H %ad',
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
