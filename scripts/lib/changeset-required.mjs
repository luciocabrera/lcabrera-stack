/**
 * Decides which published packages a change obliges to carry a changeset
 * (verify-changesets.mjs). A changed file counts only when it is in its
 * package's packed tarball: the head listing for an added or modified file, the
 * base listing for a deleted one. A package whose version the change itself
 * moves, or that had no published version at the base, is being released by the
 * change and needs no changeset. Pure, so the decision is testable without git.
 */

const SINGLE_PATH = 1;
const TWO_PATHS = 2;

const pathCount = (status) =>
  status.startsWith('R') || status.startsWith('C') ? TWO_PATHS : SINGLE_PATH;

export const parseNameStatus = (output) => {
  const fields = output.split('\0').filter((field) => field !== '');
  const changes = [];
  let index = 0;
  while (index < fields.length) {
    const status = fields[index];
    if (pathCount(status) === TWO_PATHS) {
      changes.push({
        from: fields[index + 1],
        path: fields[index + 2],
        status: status.slice(0, 1),
        unchanged: status.slice(1) === '100',
      });
      index += 3;
    } else {
      changes.push({ path: fields[index + 1], status: status.slice(0, 1) });
      index += 2;
    }
  }
  return changes;
};

export const untrackedChanges = (output) =>
  output
    .split('\0')
    .filter((path) => path !== '')
    .map((path) => ({ path, status: 'A' }));

export const changedChangesetIds = (changes) =>
  changes
    .filter(({ status }) => status !== 'D')
    .map(({ path }) => /^\.changeset\/([^/]+)\.md$/u.exec(path)?.[1])
    .filter((id) => id !== undefined && id !== 'README');

const ownerOf = (path, manifests) =>
  manifests.find(({ dir }) => path.startsWith(`${dir}/`));

const locate = (side, path, manifests) => {
  const owner = ownerOf(path, manifests);
  return owner === undefined
    ? []
    : [{ dir: owner.dir, name: owner.name, path, side }];
};

const isPureMove = (change, { base, head }) => {
  const from = ownerOf(change.from, base);
  const to = ownerOf(change.path, head);
  return (
    change.unchanged === true &&
    from !== undefined &&
    to !== undefined &&
    from.name === to.name &&
    change.from.slice(from.dir.length) === change.path.slice(to.dir.length)
  );
};

export const packageTouches = ({ changes, manifests }) =>
  changes.flatMap((change) => {
    if (change.status === 'D') {
      return locate('base', change.path, manifests.base);
    }
    if (change.status !== 'R') {
      return locate('head', change.path, manifests.head);
    }
    return isPureMove(change, manifests)
      ? []
      : [
          ...locate('base', change.from, manifests.base),
          ...locate('head', change.path, manifests.head),
        ];
  });

export const packsNeeded = (touches) => [
  ...new Map(
    touches.map(({ dir, side }) => [`${side}:${dir}`, { dir, side }]),
  ).values(),
];

const isShipped = ({ dir, path, side }, shipped) =>
  shipped.get(`${side}:${dir}`)?.has(path.slice(dir.length + 1)) === true;

const publishedVersions = (manifests) =>
  new Map(
    manifests
      .filter((manifest) => manifest.private !== true)
      .map(({ name, version }) => [name, version]),
  );

export const missingChangesets = ({
  manifests,
  namedPackages,
  shipped,
  touches,
}) => {
  const headVersions = publishedVersions(manifests.head);
  const baseVersions = publishedVersions(manifests.base);
  const releasedByChange = (name) =>
    baseVersions.get(name) !== headVersions.get(name);

  const shippedFiles = touches
    .filter((touch) => isShipped(touch, shipped))
    .filter(({ name }) => headVersions.has(name))
    .filter(({ name }) => !releasedByChange(name))
    .filter(({ name }) => !namedPackages.has(name))
    .reduce((byName, { name, path }) => {
      byName.set(name, [...(byName.get(name) ?? []), path]);
      return byName;
    }, new Map());

  return [...shippedFiles]
    .map(([name, files]) => ({ files, name }))
    .toSorted((left, right) => left.name.localeCompare(right.name));
};

const SHOWN_FILES = 3;

export const describeMissing = ({ files, name }) => {
  const shown = files.slice(0, SHOWN_FILES).join(', ');
  const rest = files.length > SHOWN_FILES ? ', …' : '';
  return `${name}: ${shown}${rest} ships in its tarball, and no changeset added or edited by this change names ${name}.`;
};
