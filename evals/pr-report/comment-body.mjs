/**
 * The pull request's eval report comment: the hidden marker it is found by,
 * the sections it is built from, and the newest envelope a side is read from.
 * Usage: imported by `write-comment.mjs` and `upsert-comment.mjs`.
 */
export const COMMENT_MARKER = '<!-- eval-history-report -->';

const HEADING = '## Eval report';

export const NO_SUITE_RAN =
  "No skill's directory or catalog entry changed, so no model suite ran. A change to `.github/skills/<skill>/` or `evals/skills/<skill>/` selects that skill's trigger tasks, and one to a skill's name, description or paths selects every skill; they run on a pull request labelled `evals`.";

export const LEFT_SURFACE =
  'This pull request no longer touches `.github/skills/`, `.claude/rules/`, `.claude/agents/` or `evals/`, so no model suite ran, and an earlier report here no longer applies.';

export const NO_ENVELOPE =
  'The skill-trigger run left no envelope, so there is nothing to report. The job log says why.';

const codeList = (names) => names.map((name) => `\`${name}\``).join(', ');

export const selectionLine = ({ scope, skills }) =>
  scope === 'all'
    ? "Ran every skill's trigger tasks, because a skill's name, description or paths changed, and that catalog is what every session sees."
    : `Ran the trigger tasks of ${codeList(skills)}, the skills whose directory this pull request changes.`;

export const optInLine = ({ scope, skills }) =>
  `No model suite ran: the eval report runs only on a pull request labelled \`evals\`. With the label, this change runs ${scope === 'all' ? "every skill's trigger tasks, because a skill's name, description or paths changed" : `the trigger tasks of ${codeList(skills)}, the skills whose directory it changes`}. Adding the label starts the run without a new push, and each later push re-runs it while the label stays.`;

export const noRunSections = ({ labelled, selection }) => {
  if (selection.scope === 'out') {
    return [LEFT_SURFACE];
  }
  if (selection.scope === 'none') {
    return [NO_SUITE_RAN];
  }
  return labelled ? undefined : [optInLine(selection)];
};

export const runStatusLines = (status) =>
  status === 'complete'
    ? []
    : [
        `This run is ${status === 'partial' ? 'a partial' : 'an aborted'} run, so it holds only the trials that finished.`,
      ];

export const commentBody = (sections) =>
  `${[COMMENT_MARKER, HEADING, ...sections].join('\n\n')}\n`;

const isReportComment = (comment) =>
  comment?.user?.type === 'Bot' &&
  typeof comment.body === 'string' &&
  comment.body.startsWith(COMMENT_MARKER);

export const reportCommentOf = (pages) =>
  pages.flat().find((comment) => isReportComment(comment));

export const newestEnvelope = ({ candidates, completeOnly }) =>
  candidates
    .filter(
      ({ envelope }) => !completeOnly || envelope.run.status === 'complete',
    )
    .toSorted((left, right) =>
      right.envelope.run.started_at.localeCompare(left.envelope.run.started_at),
    )
    .at(0);

const postRequest = ({ body, onlyExisting, pr, repo }) =>
  onlyExisting
    ? {
        args: undefined,
        summary: `#${pr} has no eval report comment and does not touch the eval surface, so none was posted.`,
      }
    : {
        args: [
          'api',
          '--method',
          'POST',
          `repos/${repo}/issues/${pr}/comments`,
          '--raw-field',
          `body=${body}`,
        ],
        summary: `Posted the eval report on #${pr}.`,
      };

export const upsertRequest = ({
  body,
  existing,
  onlyExisting = false,
  pr,
  repo,
}) =>
  existing === undefined
    ? postRequest({ body, onlyExisting, pr, repo })
    : {
        args: [
          'api',
          '--method',
          'PATCH',
          `repos/${repo}/issues/comments/${String(existing.id)}`,
          '--raw-field',
          `body=${body}`,
        ],
        summary: `Updated the eval report on #${pr}, comment ${String(existing.id)}.`,
      };

const SCOPES = new Set(['all', 'none', 'out', 'some']);

const selectionProblem = ({ scope, skills }) => {
  if (!SCOPES.has(scope)) {
    return '--scope must be out, none, some or all';
  }
  return scope === 'some' && skills.length === 0
    ? '--scope some needs at least one --skill'
    : undefined;
};

export const selectionOf = ({ scope, skill = [] }) => {
  const selection = { scope, skills: scope === 'some' ? skill : [] };
  const problem = selectionProblem(selection);
  if (problem !== undefined) {
    throw new Error(problem);
  }
  return selection;
};

const REPOSITORY = /^[\w.-]+\/[\w.-]+$/u;
const NUMBER = /^[1-9]\d*$/u;

const UPSERT_CHECKS = [
  {
    message: 'pass --repo <owner/name>',
    passes: ({ repo = '' }) => REPOSITORY.test(repo),
  },
  {
    message: 'pass --pr <number>',
    passes: ({ pr = '' }) => NUMBER.test(pr),
  },
  {
    message: 'pass --body-file <path>',
    passes: (values) => typeof values['body-file'] === 'string',
  },
];

export const upsertOptionProblems = (values) =>
  UPSERT_CHECKS.filter(({ passes }) => !passes(values)).map(
    ({ message }) => message,
  );
