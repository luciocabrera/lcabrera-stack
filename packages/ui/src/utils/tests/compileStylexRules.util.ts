/**
 * Compiles StyleX modules with the StyleX plugin and lists the single-class rules they emit.
 * jsdom applies no compiled CSS, so a test that needs the value a class sets reads it from these rules.
 */

import stylexUnplugin from '@stylexjs/unplugin';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readStylexRules } from './readStylexRules.util';

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

const VITE_META: StylexPluginMeta = { framework: 'vite' };

export const compileStylexRules = async (
  modules: readonly StylexModuleSource[],
) => {
  const created = stylexUnplugin.raw(
    {
      aliases: { '#ui/*': [`${SOURCE_ROOT}/*`] },
      dev: false,
      runtimeInjection: true,
      useCSSLayers: false,
    },
    VITE_META,
  ) as readonly StylexTransform[] | StylexTransform;
  const plugin = Array.isArray(created) ? created[0] : created;
  const outputs = await Promise.all(
    modules.map(({ path, source }) =>
      plugin?.transform.call({}, source, resolve(SOURCE_ROOT, path)),
    ),
  );

  return outputs.flatMap((output) =>
    readStylexRules(typeof output === 'string' ? output : (output?.code ?? '')),
  );
};
