/**
 * Pure builders for the repo's label taxonomy: `type:` labels (one per commit
 * type), `breaking-change`, and one `app:`/`pkg:` label per workspace. Consumed by
 * `sync-labels.mjs` (creates/updates them on GitHub) and `pr-labels.mjs` (picks
 * which apply to a PR). Colors group the families visually. See
 * `.claude/rules/scripts.md`.
 */

/** commit type → its `type:` label (name/color/description). */
const TYPE_LABELS = [
  {
    type: 'feat',
    name: 'type: feature',
    color: '0e8a16',
    description: 'A new feature',
  },
  { type: 'fix', name: 'type: bug', color: 'd73a4a', description: 'A bug fix' },
  {
    type: 'docs',
    name: 'type: docs',
    color: '0075ca',
    description: 'Documentation only',
  },
  {
    type: 'refactor',
    name: 'type: refactor',
    color: 'fbca04',
    description: 'Neither fixes a bug nor adds a feature',
  },
  {
    type: 'perf',
    name: 'type: perf',
    color: 'a2eeef',
    description: 'A performance improvement',
  },
  {
    type: 'test',
    name: 'type: test',
    color: 'bfd4f2',
    description: 'Adds or corrects tests',
  },
  {
    type: 'build',
    name: 'type: build',
    color: 'd4c5f9',
    description: 'Build system or dependencies',
  },
  {
    type: 'ci',
    name: 'type: ci',
    color: 'c5def5',
    description: 'CI configuration',
  },
  {
    type: 'chore',
    name: 'type: chore',
    color: 'cfd3d7',
    description: 'Other non-src / non-test changes',
  },
  {
    type: 'style',
    name: 'type: style',
    color: 'f9d0c4',
    description: 'Formatting / whitespace only',
  },
  {
    type: 'revert',
    name: 'type: revert',
    color: 'e4e669',
    description: 'Reverts a previous commit',
  },
];

const BREAKING_LABEL = {
  name: 'breaking-change',
  color: 'b60205',
  description: 'Introduces a breaking change',
};

const APP_COLOR = '1d76db';
const PKG_COLOR = '5319e7';

/** commit type → its label name (undefined for an unknown type). */
export const typeLabelName = (type) =>
  TYPE_LABELS.find((label) => label.type === type)?.name;

/** workspace `{ name, kind }` → its scope label name. */
export const workspaceLabelName = ({ name, kind }) => `${kind}: ${name}`;

/** The full canonical label set given the derived workspaces. */
export const buildLabelDefinitions = (workspaces) => [
  ...TYPE_LABELS.map(({ name, color, description }) => ({
    name,
    color,
    description,
  })),
  BREAKING_LABEL,
  ...workspaces.map((workspace) => ({
    name: workspaceLabelName(workspace),
    color: workspace.kind === 'app' ? APP_COLOR : PKG_COLOR,
    description: `Touches the ${workspace.name} ${workspace.kind === 'app' ? 'app' : 'package'}`,
  })),
];
