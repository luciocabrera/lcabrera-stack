/**
 * Which `@lcabrera/*` packages a created tree resolves, whether its declared
 * ranges admit the versions packed from this checkout, what the scratch
 * registry serves for each, and whether the install took every one of them
 * from those tarballs rather than npm (verify-devkit-workspace.mjs).
 *
 * Pure: the CLI hands in manifests, bytes, YAML text and the lockfile.
 */

import { createHash } from 'node:crypto';

import semver from 'semver';
import { parse, parseAllDocuments } from 'yaml';

const SCOPE = '@lcabrera/';

const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
];

const CATALOG_PROTOCOL = 'catalog:';

const declaredEntries = (manifest) =>
  DEPENDENCY_FIELDS.flatMap((field) =>
    Object.entries(manifest[field] ?? {}),
  ).filter(([name]) => name.startsWith(SCOPE));

/**
 * @param {Record<string, unknown>} manifest
 * @returns {string[]}
 */
export const scopedNames = (manifest) => [
  ...new Set(declaredEntries(manifest).map(([name]) => name)),
];

/**
 * @param {Record<string, unknown>} manifest
 * @returns {Record<string, unknown>}
 */
export const installedManifest = (manifest) =>
  Object.fromEntries(
    Object.entries(manifest).filter(([field]) => field !== 'devDependencies'),
  );

/**
 * @param {{ manifestOf: (name: string) => Record<string, unknown> | undefined,
 *           roots: readonly string[] }} args
 * @returns {{ missing: string[], names: string[] }}
 */
export const packageClosure = ({ manifestOf, roots }) => {
  const seen = new Set();
  const missing = new Set();
  const pending = [...roots];
  while (pending.length > 0) {
    const name = pending.pop();
    if (seen.has(name) || missing.has(name)) continue;
    const manifest = manifestOf(name);
    if (manifest === undefined) {
      missing.add(name);
      continue;
    }
    seen.add(name);
    pending.push(...scopedNames(installedManifest(manifest)));
  }
  const byName = (left, right) => left.localeCompare(right);
  return {
    missing: [...missing].toSorted(byName),
    names: [...seen].toSorted(byName),
  };
};

/**
 * @param {readonly string[]} missing
 * @returns {string[]}
 */
export const missingPackageFindings = (missing) =>
  missing.map(
    (name) =>
      `the created tree resolves \`${name}\`, but no workspace in this checkout is named that, so there is no tarball to install it from and the install would take it from the registry`,
  );

/**
 * @param {string} workspaceYaml
 * @returns {Record<string, Record<string, string>>}
 */
export const catalogsOf = (workspaceYaml) => {
  const document = parse(workspaceYaml) ?? {};
  return {
    ...document.catalogs,
    ...(document.catalog === undefined ? {} : { default: document.catalog }),
  };
};

const resolvedRange = ({ catalogs, name, specifier }) => {
  if (!specifier.startsWith(CATALOG_PROTOCOL)) return specifier;
  const catalog = specifier.slice(CATALOG_PROTOCOL.length) || 'default';
  return catalogs[catalog]?.[name];
};

/**
 * @param {{ catalogs: Record<string, Record<string, string>>,
 *           manifests: ReadonlyArray<{ manifest: Record<string, unknown>, where: string }> }} args
 * @returns {Array<{ name: string, range: string | undefined, specifier: string, where: string }>}
 */
export const scopedDeclarations = ({ catalogs, manifests }) =>
  manifests.flatMap(({ manifest, where }) =>
    declaredEntries(manifest).map(([name, specifier]) => ({
      name,
      range: resolvedRange({ catalogs, name, specifier }),
      specifier,
      where,
    })),
  );

const rangeFinding = ({ declaration, version }) => {
  const { name, range, specifier, where } = declaration;
  if (range === undefined) {
    return `${where} declares \`${name}\` as \`${specifier}\`, which names no catalog entry, so the gate cannot tell whether the packed ${version} satisfies it`;
  }
  if (semver.validRange(range) === null) {
    return `${where} declares \`${name}\` as \`${range}\`, which is not a version range, so the gate cannot tell whether the packed ${version} satisfies it`;
  }
  if (semver.satisfies(version, range, { includePrerelease: true })) {
    return undefined;
  }
  return `${where} declares \`${name}\` as \`${range}\`, which the ${version} packed from this checkout does not satisfy — a consumer installing both from the registry would not get this version`;
};

/**
 * @param {{ declarations: ReadonlyArray<{ name: string, range: string | undefined,
 *                                          specifier: string, where: string }>,
 *           versions: ReadonlyMap<string, string> }} args
 * @returns {string[]}
 */
export const rangeFindings = ({ declarations, versions }) =>
  declarations
    .filter(({ name }) => versions.has(name))
    .map((declaration) =>
      rangeFinding({ declaration, version: versions.get(declaration.name) }),
    )
    .filter((finding) => finding !== undefined);

/**
 * @param {Uint8Array} bytes
 * @returns {{ integrity: string }}
 */
export const digestsOf = (bytes) => ({
  integrity: `sha512-${createHash('sha512').update(bytes).digest('base64')}`,
});

/**
 * @param {{ baseUrl: string,
 *           packed: { file: string, integrity: string,
 *                     manifest: Record<string, unknown> } }} args
 * @returns {Record<string, unknown>}
 */
export const packumentFor = ({ baseUrl, packed }) => {
  const { file, integrity, manifest } = packed;
  const { name, version } = manifest;
  return {
    'dist-tags': { latest: version },
    name,
    versions: {
      [version]: {
        ...manifest,
        dist: { integrity, tarball: `${baseUrl}/-/${file}` },
      },
    },
  };
};

/**
 * @param {string} url
 * @returns {string}
 */
export const scopedRegistryConfig = (url) =>
  `${SCOPE.slice(0, -1)}:registry=${url}/\n`;

const packageKeyOf = (key) => {
  const at = key.indexOf('@', 1);
  return { name: key.slice(0, at), version: key.slice(at + 1) };
};

const sourceFinding = ({ entry, key, packed, registry }) => {
  const { name, version } = packageKeyOf(key);
  const expected = packed.get(name);
  const { integrity, tarball = '' } = entry?.resolution ?? {};
  if (
    expected !== undefined &&
    expected.version === version &&
    expected.integrity === integrity &&
    tarball.startsWith(`${registry}/`)
  ) {
    return undefined;
  }
  return `\`${name}@${version}\` was not installed from the tarball packed from this checkout, so the gate tested a published version rather than what the next release ships`;
};

/**
 * @param {{ lockfile: string,
 *           packed: ReadonlyMap<string, { integrity: string, version: string }>,
 *           registry: string }} args
 * @returns {string[]}
 */
export const unpackedSourceFindings = ({ lockfile, packed, registry }) => {
  const scoped = parseAllDocuments(lockfile)
    .flatMap((document) => Object.entries(document.toJS()?.packages ?? {}))
    .filter(([key]) => key.startsWith(SCOPE));
  const read = new Set(scoped.map(([key]) => packageKeyOf(key).name));
  return [
    ...[...packed.keys()]
      .filter((name) => !read.has(name))
      .map(
        (name) =>
          `\`${name}\` was packed from this checkout but no entry for it was read from the tree's lockfile, so nothing shows where the install took it from`,
      ),
    ...scoped
      .map(([key, entry]) => sourceFinding({ entry, key, packed, registry }))
      .filter((finding) => finding !== undefined),
  ];
};
