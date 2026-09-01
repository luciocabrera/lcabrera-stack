/**
 * Pure builders for the repo's label taxonomy: `type:` labels (one per commit
 * type), `breaking-change`, and one `app:`/`pkg:` label per workspace. Consumed by
 * `sync-labels.mjs` (creates/updates them on GitHub) and `pr-labels.mjs` (picks
 * which apply to a PR). Colors group the families visually. See
 * `.claude/rules/scripts.md`.
 */

const TYPE_LABELS = [
  ['feat', 'type: feature', '0e8a16', 'A new feature'],
  ['fix', 'type: bug', 'd73a4a', 'A bug fix'],
  ['docs', 'type: docs', '0075ca', 'Documentation only'],
  [
    'refactor',
    'type: refactor',
    'fbca04',
    'Neither fixes a bug nor adds a feature',
  ],
  ['perf', 'type: perf', 'a2eeef', 'A performance improvement'],
  ['test', 'type: test', 'bfd4f2', 'Adds or corrects tests'],
  ['build', 'type: build', 'd4c5f9', 'Build system or dependencies'],
  ['ci', 'type: ci', 'c5def5', 'CI configuration'],
  ['chore', 'type: chore', 'cfd3d7', 'Other non-src / non-test changes'],
  ['style', 'type: style', 'f9d0c4', 'Formatting / whitespace only'],
  ['revert', 'type: revert', 'e4e669', 'Reverts a previous commit'],
];

const BREAKING_LABEL = {
  name: 'breaking-change',
  color: 'b60205',
  description: 'Introduces a breaking change',
};

const APP_COLOR = '1d76db';
const PKG_COLOR = '5319e7';

export const typeLabelName = (type) =>
  TYPE_LABELS.find(([commitType]) => commitType === type)?.[1];

export const workspaceLabelName = ({ name, kind }) => `${kind}: ${name}`;

export const buildLabelDefinitions = (workspaces) => [
  ...TYPE_LABELS.map(([, name, color, description]) => ({
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
