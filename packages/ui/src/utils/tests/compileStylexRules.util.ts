/**
 * Compiles StyleX modules with the StyleX plugin and reads the declaration behind a rendered class.
 * jsdom applies no compiled CSS, so a test that needs the value a class sets reads it here.
 */

import stylexUnplugin from '@stylexjs/unplugin';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type CompiledStylexRule = {
  readonly className: string;
  readonly property: string;
  readonly pseudo: string;
  readonly value: string;
};

type ReadStylexDeclarationArgs = {
  readonly className: string | undefined;
  readonly property: string;
  readonly pseudo?: string;
  readonly rules: readonly CompiledStylexRule[];
};

type StylexModuleSource = {
  readonly path: string;
  readonly source: string;
};

type StylexTransform = {
  readonly transform: (
    this: unknown,
    code: string,
    id: string,
  ) => Promise<TransformOutput> | TransformOutput;
};

type TransformOutput = string | undefined | { readonly code: string };

const SOURCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const RULE_PATTERN = /ltr: "\.(x[\w-]+)(:?[\w-]*)\{([\w-]+):([^"]*)\}"/gu;

const createTransform = () => {
  const created = stylexUnplugin.raw(
    {
      aliases: { '#ui/*': [`${SOURCE_ROOT}/*`] },
      dev: false,
      runtimeInjection: true,
      useCSSLayers: false,
    },
    { framework: 'vite' } as never,
  ) as readonly StylexTransform[] | StylexTransform;

  return Array.isArray(created) ? created[0] : created;
};

const readCode = (output: TransformOutput) =>
  typeof output === 'string' ? output : (output?.code ?? '');

export const compileStylexRules = async (
  modules: readonly StylexModuleSource[],
) => {
  const transform = createTransform();
  const outputs = await Promise.all(
    modules.map(({ path, source }) =>
      transform?.transform.call({}, source, resolve(SOURCE_ROOT, path)),
    ),
  );

  return outputs.flatMap((output) =>
    readCode(output)
      .matchAll(RULE_PATTERN)
      .map(([, className = '', pseudo = '', property = '', value = '']) => ({
        className,
        property,
        pseudo,
        value,
      }))
      .toArray(),
  );
};

export const readStylexDeclaration = ({
  className = '',
  property,
  pseudo = '',
  rules,
}: ReadStylexDeclarationArgs) => {
  const classNames = new Set(className.split(' '));

  return rules.find(
    (rule) =>
      classNames.has(rule.className) &&
      rule.property === property &&
      rule.pseudo === pseudo,
  )?.value;
};
