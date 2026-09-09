/*
 * The shipped shapes `shipped-ranges.test.mjs` reasons about, kept beside it
 * rather than inside it: a workspace catalog with the entries and the noise a
 * real one carries, the two file names the readers key on, and the versions the
 * repository publishes in these cases.
 */

export const YAML = 'pnpm-workspace.yaml';

export const MANIFEST = 'package.json';

export const CATALOG = [
  'packages:',
  '  - packages/*',
  '',
  'engineStrict: true',
  '',
  'catalogs:',
  '  build:',
  '    typescript: ^6.0.3',
  '    # keep in lockstep with the toolchain release',
  '    vite: npm:@voidzero-dev/vite-plus-core@0.3.0',
  '',
  '  stack:',
  "    '@lcabrera/tsconfig': '>=0.2.2 <1.0.0'",
  "    '@lcabrera/vite-config': ^0.4.1",
  '',
].join('\n');

export const VERSIONS = {
  '@lcabrera/tsconfig': '0.2.2',
  '@lcabrera/vite-config': '0.5.0',
};

export const BOTH_SHAPES = [
  { kind: 'manifest', path: MANIFEST },
  { kind: 'catalog', path: YAML },
];

export const MANIFEST_DECLARATIONS = [
  {
    field: 'devDependencies',
    name: '@lcabrera/tsconfig',
    path: MANIFEST,
    range: '>=0.2.2 <1.0.0',
  },
];

export const YAML_DECLARATIONS = [
  {
    line: 51,
    name: '@lcabrera/tsconfig',
    path: YAML,
    range: '>=0.2.2 <1.0.0',
  },
  {
    line: 52,
    name: '@lcabrera/vite-config',
    path: YAML,
    range: '>=0.5.0 <1.0.0',
  },
];

export const ALL_MENTIONS = [
  { name: '@lcabrera/tsconfig', path: YAML },
  { name: '@lcabrera/vite-config', path: YAML },
  { name: '@lcabrera/tsconfig', path: MANIFEST },
];
