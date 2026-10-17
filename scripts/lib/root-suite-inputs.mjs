/**
 * Lists the tracked paths a root test suite can read, so a test can assert that
 * `gates.affectedTests.rootSuites` selects the suite for every one of them
 * instead of trusting a hand-kept roster. It scans the suite's sources for
 * relative specifiers, repo-relative path literals, `join(REPO_ROOT, …)` calls
 * and imports of a workspace package, then follows relative imports into
 * modules outside the suite and scans those by the same rules. A path computed
 * at runtime is invisible to it, so it over-reads literals and can still miss a
 * computed read.
 *
 * Usage: `suiteInputs({ graph, readSource, suiteDir, tracked })`, from a test.
 */
import { posix } from 'node:path';

const SOURCE = /\.(?:mjs|cjs|js)$/u;
const STRING_LITERAL = /(['"`])((?:(?!\1)[^\\$\n])+)\1/gu;
const IMPORT_SPECIFIER =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)(['"])([^'"]+)\1/gu;
const REPO_ROOT_JOIN =
  /\b(?:join|resolve)\(\s*REPO_ROOT\s*,((?:\s*'[^'\n]*'\s*,?)+)\)/gu;
const QUOTED = /'([^']*)'/gu;

const isRelative = (value) => value.startsWith('./') || value.startsWith('../');

const isInside = (path, dir) => path === dir || path.startsWith(`${dir}/`);

const literals = (source) =>
  [...source.matchAll(STRING_LITERAL)].map((match) => match[2]);

const specifiers = (source) =>
  [...source.matchAll(IMPORT_SPECIFIER)].map((match) => match[2]);

const fromFile = (file, value) => posix.join(posix.dirname(file), value);

const relativeTargets = (source, file) =>
  literals(source)
    .filter(isRelative)
    .map((value) => fromFile(file, value));

const literalPaths = (source) =>
  literals(source)
    .filter((value) => !isRelative(value) && value.includes('/'))
    .map((value) => posix.normalize(value));

const repoRootJoins = (source) =>
  [...source.matchAll(REPO_ROOT_JOIN)].map((match) =>
    [...match[1].matchAll(QUOTED)].map((part) => part[1]).join('/'),
  );

const workspaceImports = (source, graph) =>
  specifiers(source).flatMap((specifier) =>
    graph
      .filter(
        (workspace) =>
          specifier === workspace.pkgName ||
          specifier.startsWith(`${workspace.pkgName}/`),
      )
      .map((workspace) => `${workspace.dir}/package.json`),
  );

const relativeImports = (source, file) =>
  specifiers(source)
    .filter(isRelative)
    .map((value) => fromFile(file, value));

const referencedPaths = ({ file, graph, source }) => [
  ...relativeTargets(source, file),
  ...literalPaths(source),
  ...repoRootJoins(source),
  ...workspaceImports(source, graph),
];

const outsideModules = ({ files, readSource, suiteDir, trackedFiles }) => {
  const seen = new Set();
  const queue = files.flatMap((file) =>
    relativeImports(readSource(file), file),
  );
  while (queue.length > 0) {
    const file = queue.pop();
    if (
      !isInside(file, suiteDir) &&
      !seen.has(file) &&
      trackedFiles.has(file)
    ) {
      seen.add(file);
      queue.push(...relativeImports(readSource(file), file));
    }
  }
  return [...seen];
};

const directoriesOf = (tracked) =>
  new Set(
    tracked.flatMap((file) =>
      file
        .split('/')
        .slice(0, -1)
        .map((_, index, parts) => parts.slice(0, index + 1).join('/')),
    ),
  );

export const suiteInputs = ({ graph, readSource, suiteDir, tracked }) => {
  const trackedFiles = new Set(tracked);
  const directories = directoriesOf(tracked);
  const files = tracked.filter(
    (file) => isInside(file, suiteDir) && SOURCE.test(file),
  );
  const reached = outsideModules({ files, readSource, suiteDir, trackedFiles });
  const candidates = [
    ...[...files, ...reached].flatMap((file) =>
      referencedPaths({ file, graph, source: readSource(file) }),
    ),
    ...reached,
  ]
    .map((path) => path.replace(/\/+$/u, ''))
    .filter((path) => !isInside(path, suiteDir));
  const probes = candidates
    .filter((path) => trackedFiles.has(path) || directories.has(path))
    .map((path) => (directories.has(path) ? `${path}/` : path));
  return [...new Set(probes)].sort((left, right) => left.localeCompare(right));
};
