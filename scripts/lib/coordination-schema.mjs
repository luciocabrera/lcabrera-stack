/**
 * Pure schema validators for coordination task/branch frontmatter. Each returns
 * a list of problem messages (without the filename prefix — the caller adds it).
 * Kept out of `verify-coordination.mjs` so that file stays under the size ceiling
 * and each validator is a small, single-purpose function. See `.claude/rules/scripts.md`.
 */
import { branchSlug } from '../../packages/repo-standards/scripts/coordination-parse.mjs';

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const OWNER = /^(agent|human):.+/;
// A GitHub issue reference: `#123`, a bare `123`, or a full issues URL. The
// custom frontmatter parser keeps `#` literally (it is not YAML), so `#123` is
// safe unquoted. `(none)` and other placeholders deliberately fail — every
// claim must link its backlog item (ADR-036).
const ISSUE_REF = /^(#?\d+|https?:\/\/\S+\/issues\/\d+)$/;
const TASK_STATUSES = new Set([
  'active',
  'blocked',
  'review',
  'paused',
  'done',
]);
const BRANCH_STATUSES = new Set(['active', 'merging', 'done']);
const TASK_REQUIRED = [
  'id',
  'title',
  'owner',
  'status',
  'branch',
  'area',
  'issue',
  'started',
  'updated',
];
const BRANCH_REQUIRED = [
  'branch',
  'base',
  'target',
  'integrator',
  'status',
  'updated',
];

const isBlank = (value) =>
  value === undefined || (Array.isArray(value) && value.length === 0);

const missingFields = (data, required) =>
  required
    .filter((field) => isBlank(data[field]))
    .map((field) => `missing required field \`${field}\``);

const enumError = (label, value, allowed) =>
  value !== undefined && !allowed.has(value)
    ? `${label} \`${value}\` is not one of ${[...allowed].join(', ')}`
    : undefined;

const patternError = (label, value, pattern, hint) =>
  value !== undefined && !pattern.test(value)
    ? `${label} \`${value}\` ${hint}`
    : undefined;

const ownerError = (label, value) =>
  patternError(
    label,
    value,
    OWNER,
    'must look like `agent:<name>` or `human:<name>`',
  );

const dateError = (label, value) =>
  patternError(label, value, ISO_DATE, 'is not YYYY-MM-DD');

const issueError = (label, value) =>
  patternError(
    label,
    value,
    ISSUE_REF,
    'must link a GitHub issue — `#<n>` or an issues URL (every claim links its ' +
      'backlog item; see ADR-036) — run `coordination:claim` to create/link one',
  );

const slugMismatch = (slug, id) =>
  id !== undefined && id !== slug
    ? `id \`${id}\` must match the filename slug \`${slug}\``
    : undefined;

const dupId = (id, seen) =>
  id !== undefined && seen.has(id)
    ? `duplicate id \`${id}\` (also in ${seen.get(id)})`
    : undefined;

const slugForBranch = (slug, branch) =>
  branch !== undefined && slug !== branchSlug(branch)
    ? `filename must be the branch slug \`${branchSlug(branch)}.md\``
    : undefined;

/** Problems for one task file (filename prefix added by the caller). `seen` maps
 *  an already-visited id → its filename, for the duplicate check. */
export const taskErrors = ({ slug, data }, seen) =>
  [
    ...missingFields(data, TASK_REQUIRED),
    enumError('status', data.status, TASK_STATUSES),
    ownerError('owner', data.owner),
    issueError('issue', data.issue),
    dateError('started', data.started),
    dateError('updated', data.updated),
    slugMismatch(slug, data.id),
    dupId(data.id, seen),
  ].filter(Boolean);

/** Problems for one shared-branch descriptor file. */
export const branchErrors = ({ slug, data }) =>
  [
    ...missingFields(data, BRANCH_REQUIRED),
    enumError('status', data.status, BRANCH_STATUSES),
    ownerError('integrator', data.integrator),
    dateError('updated', data.updated),
    slugForBranch(slug, data.branch),
  ].filter(Boolean);
