/**
 * The decisions behind `repo-fallow-gate` that precede a run: which analyses
 * exist, which files each one reads, and the fallow invocation it is. The
 * verdict on a report is `./fallow-gate-report.mjs`. Pure: no I/O.
 */
import { isAbsolute, relative, sep } from 'node:path';

const SOURCE_FILE = /\.(?:[cm]?[jt]sx?|vue|svelte|astro)$/u;

const byName = (left, right) => left.localeCompare(right);

const EXIT_CODE_ANALYSES = new Set(['architecture', 'guard', 'security']);

const REPORT_ANALYSES = new Set([
  'coverage-gaps',
  'similar-code',
  'suppressions',
]);

export const ANALYSES = [
  ...EXIT_CODE_ANALYSES,
  ...REPORT_ANALYSES,
  'mutation',
].toSorted(byName);

export const NEEDS_BASE = new Set(['coverage-gaps', 'mutation', 'security']);

const VERDICT_SOURCES = new Map([
  ...[...EXIT_CODE_ANALYSES].map((analysis) => [analysis, 'exit-code']),
  ...[...REPORT_ANALYSES].map((analysis) => [analysis, 'report']),
  ['mutation', 'mutation'],
]);

export const verdictSource = (analysis) => VERDICT_SOURCES.get(analysis);

export const toRepoPath = ({ file, root }) => {
  const path = isAbsolute(file) ? relative(root, file) : file;
  return path.split(sep).join('/');
};

export const sourceFiles = (files) =>
  [...new Set(files.filter((file) => SOURCE_FILE.test(file)))].toSorted(byName);

const fileFlags = (files) => files.flatMap((file) => ['--file', file]);

const ARGS_BY_ANALYSIS = {
  architecture: ({ files }) => ['architecture', '--quiet', ...fileFlags(files)],
  'coverage-gaps': () => [
    'health',
    '--coverage-gaps',
    '--format',
    'json',
    '--quiet',
  ],
  guard: ({ files }) => ['guard', '--quiet', ...files],
  security: ({ base }) => [
    'security',
    '--quiet',
    '--gate',
    'new',
    '--changed-since',
    base,
  ],
  'similar-code': ({ files }) => [
    'similar-code',
    '--format',
    'json',
    '--quiet',
    ...fileFlags(files),
  ],
  suppressions: ({ files }) => [
    'suppressions',
    '--format',
    'json',
    '--quiet',
    ...fileFlags(files),
  ],
};

export const fallowArgs = ({ analysis, base, files }) => {
  const build = ARGS_BY_ANALYSIS[analysis];
  if (build === undefined) {
    throw new Error(`no single fallow invocation for "${analysis}"`);
  }
  return build({ base, files });
};

export const REPOSITORY_ROOT = '.';

export const mutationArgs = ({ base, diffFile, root }) => [
  'mutation',
  '--root',
  root,
  '--changed-since',
  base,
  ...(diffFile === undefined ? [] : ['--diff-file', diffFile]),
  '--min-score',
  '100',
  '--allow-dirty',
  '--quiet',
];

export const mutationRoots = ({ files, workspaceDirs }) => {
  const byLength = workspaceDirs.toSorted(
    (left, right) => right.length - left.length,
  );
  const owners = files.map((file) => ({
    file,
    root: byLength.find((dir) => file.startsWith(`${dir}/`)),
  }));
  return {
    outside: owners
      .filter(({ root }) => root === undefined)
      .map(({ file }) => file),
    roots: [
      ...new Set(
        owners.map(({ root }) => root).filter((root) => root !== undefined),
      ),
    ].toSorted(byName),
  };
};

export const binOf = ({ manifest, name }) =>
  typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.[name];
