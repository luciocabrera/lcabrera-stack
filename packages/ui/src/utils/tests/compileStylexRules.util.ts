/**
 * Compiles StyleX modules with the StyleX plugin and lists the single-class rules they emit.
 * jsdom applies no compiled CSS, so a test that needs the value a class sets reads it from these rules.
 */

import stylexUnplugin from '@stylexjs/unplugin';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type CompiledStylexRule = {
  readonly className: string;
  readonly property: string;
  readonly pseudo: string;
  readonly value: string;
};

type StylexModuleSource = {
  readonly path: string;
  readonly source: string;
};

type StylexPluginMeta = Parameters<typeof stylexUnplugin.raw>[1];

type StylexTransform = {
  readonly transform: (
    this: unknown,
    code: string,
    id: string,
  ) => Promise<TransformOutput> | TransformOutput;
};

type TransformOutput = string | undefined | { readonly code: string };

const SOURCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const RULE_MARKER = 'ltr: "';

const VITE_META: StylexPluginMeta = { framework: 'vite' };

const createTransform = () => {
  const created = stylexUnplugin.raw(
    {
      aliases: { '#ui/*': [`${SOURCE_ROOT}/*`] },
      dev: false,
      runtimeInjection: true,
      useCSSLayers: false,
    },
    VITE_META,
  ) as readonly StylexTransform[] | StylexTransform;

  return Array.isArray(created) ? created[0] : created;
};

const readCode = (output: TransformOutput) =>
  typeof output === 'string' ? output : (output?.code ?? '');

export const parseStylexRule = (css: string) => {
  const open = css.indexOf('{');

  if (
    open === -1 ||
    !css.startsWith('.x') ||
    !css.endsWith('}') ||
    css.includes('{', open + 1)
  ) {
    return;
  }

  const body = css.slice(open + 1, -1);
  const colon = body.indexOf(':');

  if (colon === -1) return;

  const selector = css.slice(1, open);
  const pseudoStart = selector.indexOf(':');

  return {
    className: pseudoStart === -1 ? selector : selector.slice(0, pseudoStart),
    property: body.slice(0, colon),
    pseudo: pseudoStart === -1 ? '' : selector.slice(pseudoStart),
    value: body.slice(colon + 1),
  };
};

const readRules = (code: string) =>
  code
    .split(RULE_MARKER)
    .slice(1)
    .map((chunk) => parseStylexRule(chunk.slice(0, chunk.indexOf('"'))))
    .filter((rule): rule is CompiledStylexRule => rule !== undefined);

export const compileStylexRules = async (
  modules: readonly StylexModuleSource[],
) => {
  const transform = createTransform();
  const outputs = await Promise.all(
    modules.map(({ path, source }) =>
      transform?.transform.call({}, source, resolve(SOURCE_ROOT, path)),
    ),
  );

  return outputs.flatMap((output) => readRules(readCode(output)));
};
