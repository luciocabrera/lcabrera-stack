/**
 * The pure half of the published-manifest audit (scripts/release-audit.mjs).
 *
 * `publish:verify` checks the tarball this repo *would* produce, packing with
 * pnpm because `publishConfig.exports` substitution is a pnpm extension
 * (ADR-073). A defect that exists only in an `npm pack` tarball is therefore
 * invisible to it by construction — which is how `@lcabrera/eslint-plugin@0.1.0`
 * reached npm uninstallable with every gate here green (#730). This module
 * decides the same questions against the manifest a consumer would actually
 * receive.
 *
 * Two assertions, and they are not symmetric:
 *
 * - **An unsubstituted `catalog:`/`workspace:` range** is a defect in every
 *   package. Nothing legitimately publishes one; npm has no handler for either
 *   protocol and aborts at resolution with `EUNSUPPORTEDPROTOCOL`.
 * - **A `./src/` export target** is a defect only in a package this repo
 *   *builds*. `@lcabrera/ui` ships source on purpose — StyleX derives theme
 *   identity from the source path — so the classification comes from the same
 *   `isBuiltPublicPackage` predicate `publish:verify` uses, and the two gates
 *   agree by construction rather than by two copies of a list.
 *
 * See ADR-077 for the version-coverage and blocking decisions this encodes.
 */

const SOURCE_PREFIX = './src/';

/**
 * Every dependency field a published manifest can carry. `devDependencies` is
 * audited too: a consumer never installs it, so it cannot break an install, but
 * an unsubstituted range there is the same evidence — the wrong packer ran.
 */
const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
];

/** The fields npm resolves on install, and so aborts on. */
const INSTALL_TIME_FIELDS = new Set([
  'dependencies',
  'optionalDependencies',
  'peerDependencies',
]);

/** Cosmetic ordering only — the gate does not depend on it. */
const VERSION_COLLATOR = new Intl.Collator('en', { numeric: true });

export const compareVersions = (left, right) =>
  VERSION_COLLATOR.compare(left, right);

/**
 * Every leaf target in an `exports` field, with the key trail that reached it.
 *
 * `exports` is a tree: subpaths, then condition objects, then arrays as a
 * fallback list. Only the leaf strings are targets, and `null` (a deliberately
 * blocked subpath) is not one.
 */
export const flattenExportTargets = (node, trail = []) => {
  if (typeof node === 'string') {
    return [{ target: node, trail }];
  }

  if (Array.isArray(node)) {
    return node.flatMap((entry, index) =>
      flattenExportTargets(entry, [...trail, String(index)]),
    );
  }

  if (node !== null && typeof node === 'object') {
    return Object.entries(node).flatMap(([key, value]) =>
      flattenExportTargets(value, [...trail, key]),
    );
  }

  return [];
};

/** `exports["."]["types"]` — the path a reader can look up in the manifest. */
export const describeExportPath = (trail) => {
  const keys = trail.map((key) => `[${JSON.stringify(key)}]`).join('');

  return `exports${keys}`;
};

export const sourceExportProblems = (manifest) =>
  flattenExportTargets(manifest.exports)
    .filter(({ target }) => target.startsWith(SOURCE_PREFIX))
    .map(
      ({ target, trail }) =>
        `${describeExportPath(trail)} ships source: "${target}" — Node refuses to strip types inside node_modules`,
    );

export const hasLocalProtocol = (range) =>
  range.includes('catalog:') || range.includes('workspace:');

export const localProtocolProblems = (manifest) =>
  DEPENDENCY_FIELDS.flatMap((field) =>
    Object.entries(manifest[field] ?? {})
      .filter(
        ([, range]) => typeof range === 'string' && hasLocalProtocol(range),
      )
      .map(([name, range]) => {
        const consequence = INSTALL_TIME_FIELDS.has(field)
          ? ' — npm aborts the install with EUNSUPPORTEDPROTOCOL'
          : ' — an unsubstituted pnpm protocol';

        return `${field}["${name}"]: "${range}"${consequence}`;
      }),
  );

export const manifestProblems = ({ manifest, shipsSource }) => [
  ...(shipsSource ? [] : sourceExportProblems(manifest)),
  ...localProtocolProblems(manifest),
];

/**
 * `broken` fails the audit; `deprecated` is reported and does not.
 *
 * An npm version is immutable, so a broken one can never be repaired — only
 * superseded. `npm deprecate` is the only remediation the registry offers, and
 * it is consumer-visible, so it discharges the finding rather than hiding it
 * (the version still appears in the report). Without that, a permanently red
 * gate is a permanently ignored one.
 *
 * **A version behind a dist-tag is never discharged**, deprecated or not:
 * `npm install <name>` still resolves there, so the warning is all a consumer
 * gets before the broken artifact lands.
 */
export const classifyAuditedVersion = ({ deprecated, problems, tags }) => {
  if (problems.length === 0) {
    return 'clean';
  }

  if (tags.length > 0) {
    return 'broken';
  }

  return deprecated ? 'deprecated' : 'broken';
};

export const auditVersion = ({ manifest, shipsSource, tags, version }) => {
  const deprecated = manifest.deprecated !== undefined;
  const problems = manifestProblems({ manifest, shipsSource });

  return {
    deprecated,
    problems,
    state: classifyAuditedVersion({ deprecated, problems, tags }),
    tags,
    version,
  };
};

/** Which dist-tags point at each version, so a tagged defect stays a failure. */
export const tagsByVersion = (distTags = {}) =>
  Object.entries(distTags).reduce((byVersion, [tag, version]) => {
    byVersion.set(version, [...(byVersion.get(version) ?? []), tag]);

    return byVersion;
  }, new Map());

/**
 * Every published version, not only `dist-tags.latest`: an old version is
 * immutable and stays installable forever, so a consumer who pinned one gets
 * the broken artifact indefinitely while a latest-only audit reports clean.
 * ADR-077 records the choice and what bounds its noise.
 */
export const auditPackument = ({ only, packument, shipsSource }) => {
  const tags = tagsByVersion(packument['dist-tags']);

  return Object.entries(packument.versions ?? {})
    .filter(([version]) => only === undefined || only === version)
    .map(([version, manifest]) =>
      auditVersion({
        manifest,
        shipsSource,
        tags: tags.get(version) ?? [],
        version,
      }),
    )
    .sort((left, right) => compareVersions(left.version, right.version));
};

export const selectBroken = (audited) =>
  audited.flatMap(({ name, versions }) =>
    versions
      .filter(({ state }) => state === 'broken')
      .map(({ version }) => `${name}@${version}`),
  );

/**
 * True when the run asked the registry about at least one package and resolved
 * none of them.
 *
 * A single 404 is an **answer**: it is how a package awaiting its first publish
 * presents, which is why the sweep tolerates one and why `@lcabrera/tsconfig`
 * did not fail this gate before it shipped. Every package 404ing at once is not
 * that many coincidences — it is a registry that is not answering. A
 * misconfigured proxy, a wrong `npm_config_registry` and an auth failure
 * serving 404 instead of 401 all present exactly that way, and each one
 * produces "audited every package, all clean" from a run that read nothing.
 * That is the believed-green failure this whole gate is built to refuse, so an
 * unroutable registry and a registry that denies everything must reach the same
 * verdict.
 *
 * **A repository that has published nothing yet lands here too, and fails on
 * purpose.** The audit cannot tell that state apart from a dead registry from
 * 404s alone, and of the two ways to be wrong, staying green while blind is the
 * one that gets believed. The cost is bounded: it clears itself the moment the
 * first package publishes, and it says it resolved nothing rather than naming a
 * defect that does not exist. ADR-077.
 */
export const resolvedNothing = (audited) =>
  audited.length > 0 && audited.every(({ published }) => !published);

/**
 * What to tell a reader whose run established nothing.
 *
 * Which explanations are worth offering depends on what was asked for, and the
 * difference is not cosmetic. A sweep of this repository's own packages can only
 * be an empty registry or one that is not answering. A run handed package names
 * has a third way to get here that is far likelier than either — a name that is
 * simply wrong — and sending that reader to go and check their proxy is sending
 * them at the two things that are fine.
 *
 * The offending names are already listed above this message by the caller, so
 * this only has to say which class of cause to suspect.
 */
export const readNothing = ({ named, registry }) =>
  [
    `✗ ${registry} answered "not published" for every package asked about, so this run read nothing.`,
    named
      ? '  Either a name asked for is not on this registry, or the registry is not answering —'
      : '  Either nothing here has been published yet, or the registry is not answering —',
    '  a proxy, a wrong `npm_config_registry`, or an auth failure serving 404 rather than 401.',
    '  This audit does not report clean on a run that established nothing. See ADR-077.',
  ].join('\n');

const STATE_MARK = { broken: '✗', clean: '✓', deprecated: '⚠' };

const renderTags = (tags) => {
  const ordered = [...tags].sort((left, right) => left.localeCompare(right));

  return tags.length === 0 ? '' : ` (${ordered.join(', ')})`;
};

const renderVersion = ({ problems, state, tags, version }) => {
  const suffix = state === 'deprecated' ? ' — deprecated on the registry' : '';
  const head = `  ${STATE_MARK[state]} ${version}${renderTags(tags)}${suffix}`;

  return [head, ...problems.map((problem) => `      ${problem}`)];
};

const renderEmpty = (published) =>
  published ? '  — no such version on npm' : '  — not on npm';

const renderPackage = ({ name, published, versions }) =>
  versions.length === 0
    ? [name, renderEmpty(published)]
    : [name, ...versions.flatMap(renderVersion)];

/**
 * The whole report, always — a package with nothing wrong is listed too, so a
 * package silently dropping out of the audit is visible rather than looking
 * like a pass.
 */
export const renderAudit = ({ audited, registry }) =>
  [
    `Published manifest audit — ${registry}`,
    '',
    ...audited.flatMap((entry) => [...renderPackage(entry), '']),
  ].join('\n');
