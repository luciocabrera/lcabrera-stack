/**
 * The created-workspace gate's probe for a class field with no initializer.
 * The blueprint source declares no such field, so a Babel preset that drops one
 * builds and serves exactly as one that keeps it, and the field's name stays in
 * the bundle as a string either way. So the gate commits a resource route whose
 * class declares the field, lets the tree's own build compile it, and asks the
 * built server module whether an instance owns the field — once under the
 * `full` blueprint's app config, which the tree places, and once under the
 * `workspace` blueprint's, taken from the packed devkit (#1385).
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { run } from './devkit-pack.mjs';
import { execute } from './devkit-tree-run.mjs';
import {
  BUILT_SERVER_ENTRY,
  commandLabel,
  outputTail,
  taskFindings,
} from './devkit-workspace.mjs';

export const PROBE_FIELD = 'uninitialisedProbeField';

export const PROBE_MODULE = 'routes/api/declare-field-probe/root';

export const PROBE_FILE = `apps/web/src/${PROBE_MODULE}.ts`;

export const ROUTES_FILE = 'apps/web/src/routes.ts';

export const APP_CONFIG = 'apps/web/vite.config.ts';

const ROUTES_CLOSE = '] satisfies RouteConfig;';

const PROBE_ROUTE = `  route('_probe/declare-field', '${PROBE_MODULE}.ts'),\n`;

const VERDICT_MARK = 'declare-field-probe:';

const BUILD_ARGS = ['run', 'build'];

const PLANT_MESSAGE = 'test: plant the declare-field probe';

const GIT_IDENTITY = [
  '-c',
  'user.name=gate',
  '-c',
  'user.email=gate@localhost',
];

export const PROBE_SOURCE = `class DeclareFieldProbe {
  ${PROBE_FIELD}: string | undefined;
}

export const loader = () => ({
  kept: Object.hasOwn(new DeclareFieldProbe(), '${PROBE_FIELD}'),
});
`;

/**
 * @param {string} routes
 * @returns {string | undefined}
 */
export const withProbeRoute = (routes) => {
  const close = routes.lastIndexOf(ROUTES_CLOSE);
  return close === -1
    ? undefined
    : `${routes.slice(0, close)}${PROBE_ROUTE}${routes.slice(close)}`;
};

/**
 * @param {{ entry: string, routeId: string }} args
 * @returns {string}
 */
const verdictScript = ({ entry, routeId }) =>
  [
    `const build = await import(${JSON.stringify(pathToFileURL(entry).href)});`,
    `const route = build.routes[${JSON.stringify(routeId)}];`,
    'const answer = route === undefined ? null : await route.module.loader();',
    String.raw`process.stdout.write('\n${VERDICT_MARK}' + JSON.stringify(answer) + '\n');`,
  ].join('\n');

/**
 * @param {string} output
 * @returns {unknown}
 */
const answerIn = (output) => {
  const line = output
    .split('\n')
    .findLast((candidate) => candidate.startsWith(VERDICT_MARK));
  return line === undefined
    ? undefined
    : JSON.parse(line.slice(VERDICT_MARK.length));
};

/**
 * @param {{ blueprint: string, error?: string, output: string,
 *           status: number | null }} args
 * @returns {string[]}
 */
export const probeVerdictFindings = ({ blueprint, error, output, status }) => {
  const subject = `the build under the \`${blueprint}\` blueprint's \`${APP_CONFIG}\``;
  const answer =
    error === undefined && status === 0 ? answerIn(output) : undefined;
  if (answer === undefined) {
    return [
      `importing \`${BUILT_SERVER_ENTRY}\` from ${subject} to call the \`${PROBE_MODULE}\` loader failed:\n${outputTail(output)}`,
    ];
  }
  if (answer === null) {
    return [
      `${subject} has no \`${PROBE_MODULE}\` route, so the declare-field probe never reached the server bundle`,
    ];
  }
  return answer.kept === true
    ? []
    : [
        `${subject} dropped a class field that has no initializer: \`Object.hasOwn(new DeclareFieldProbe(), '${PROBE_FIELD}')\` is ${String(answer.kept)} in \`${BUILT_SERVER_ENTRY}\`, so that config's \`@babel/preset-typescript\` entry erases the field the tree's tsconfig keeps (\`allowDeclareFields\`)`,
      ];
};

/**
 * @param {{ tree: string }} args
 * @returns {string[]}
 */
export const plantedProbeFindings = ({ tree }) => {
  const routesPath = join(tree, ROUTES_FILE);
  const routes = withProbeRoute(readFileSync(routesPath, 'utf8'));
  if (routes === undefined) {
    return [
      `the created tree's \`${ROUTES_FILE}\` has no \`${ROUTES_CLOSE}\` line, so the gate cannot route its declare-field probe`,
    ];
  }
  writeFileSync(routesPath, routes);
  mkdirSync(dirname(join(tree, PROBE_FILE)), { recursive: true });
  writeFileSync(join(tree, PROBE_FILE), PROBE_SOURCE);
  run('git', ['add', '--', ROUTES_FILE, PROBE_FILE], tree);
  run(
    'git',
    [...GIT_IDENTITY, 'commit', '--no-verify', '--quiet', '-m', PLANT_MESSAGE],
    tree,
  );
  return [];
};

/**
 * @param {{ blueprint: string, tree: string }} args
 * @returns {string[]}
 */
const builtProbeFindings = ({ blueprint, tree }) =>
  probeVerdictFindings({
    blueprint,
    ...execute({
      args: [
        '--input-type=module',
        '--eval',
        verdictScript({
          entry: join(tree, BUILT_SERVER_ENTRY),
          routeId: PROBE_MODULE,
        }),
      ],
      command: process.execPath,
      cwd: join(tree, 'apps', 'web'),
    }),
  });

/**
 * @param {{ tree: string }} args
 * @returns {string[]}
 */
export const placedConfigFieldFindings = ({ tree }) =>
  builtProbeFindings({ blueprint: 'full', tree });

/**
 * @param {string} devkit
 * @returns {string}
 */
export const shippedBlueprints = (devkit) =>
  join(dirname(dirname(devkit)), '@lcabrera', 'devkit', 'assets');

/**
 * @param {{ devkit: string, tree: string }} args
 * @returns {string[]}
 */
export const workspaceConfigFieldFindings = ({ devkit, tree }) => {
  const configPath = join(tree, APP_CONFIG);
  const placed = readFileSync(configPath, 'utf8');
  writeFileSync(
    configPath,
    readFileSync(
      join(shippedBlueprints(devkit), 'workspace', APP_CONFIG),
      'utf8',
    ),
  );
  try {
    const built = taskFindings({
      label: `${commandLabel(BUILD_ARGS)} (under the \`workspace\` blueprint's \`${APP_CONFIG}\`)`,
      ...execute({ args: BUILD_ARGS, command: 'vp', cwd: tree }),
    });
    return built.length > 0
      ? built
      : builtProbeFindings({ blueprint: 'workspace', tree });
  } finally {
    writeFileSync(configPath, placed);
  }
};
