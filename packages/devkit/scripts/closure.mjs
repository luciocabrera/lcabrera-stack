/*
 * Answers one question about a directory that is about to be shipped: what does
 * it need that it does not contain?
 *
 * Pure by design: callers pass file contents in and get findings back, so the
 * walking, printing and exit code live in the CLI. Escapes are reported by kind
 * because they fail differently for a consumer — a `link` is a file they will
 * not have, a `command` a tool their shell may not resolve, an `import` a module
 * their install will not provide, a `bin` an executable their install will not
 * place, a `secret` a value only their repository settings can supply, and a
 * `requires` a config key no consumer could set.
 */

import { artifactEscapes } from './closure-artifacts.mjs';
import {
  classifyImport,
  classifyLink,
  classifyPathToken,
  directoryOf,
  toCommandEscapes,
} from './closure-classify.mjs';
import {
  extractCommands,
  extractImportSpecifiers,
  extractLinkTargets,
  extractPathTokens,
} from './closure-extract.mjs';
import { requiredConfigKeys, requiresDeclarationLine } from './frontmatter.mjs';

export { classifyLink, classifyPathToken } from './closure-classify.mjs';

const SOURCE_EXTENSIONS = ['.cjs', '.js', '.mjs', '.mts', '.ts'];

const isSourceFile = (path) =>
  SOURCE_EXTENSIONS.some((extension) => path.endsWith(extension));

const KEY_SEPARATOR = String.fromCodePoint(0);

const dedupe = (escapes) => {
  const seen = new Set();
  return escapes.filter((finding) => {
    const key = [
      finding.file,
      finding.kind,
      finding.resolved ?? finding.reference,
    ].join(KEY_SEPARATOR);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const toEscapes = ({ classified, file }) =>
  classified
    .filter((reference) => reference.kind === 'escape')
    .map((reference) => ({
      file: file.path,
      kind: 'link',
      line: reference.line,
      reference: reference.target,
      resolved: reference.resolved,
    }));

const toRequiresEscapes = ({ allowedKeys, file }) =>
  requiredConfigKeys(file.content)
    .filter((key) => !allowedKeys.has(key))
    .map((key) => ({
      file: file.path,
      kind: 'requires',
      line: requiresDeclarationLine(file.content),
      reference: `config.${key}`,
    }));

/**
 * @param {{ files: { path: string, content: string }[], rootDirectory: string,
 *   agentDirectory?: string,
 *   allowedBins?: Iterable<string>,
 *   allowedCommands?: Iterable<string>,
 *   allowedConfigKeys?: Iterable<string>,
 *   exists?: (repoRelativePath: string) => boolean,
 *   shipped?: Set<string> }} args
 */
export const analyseClosure = ({
  agentDirectory,
  allowedBins = [],
  allowedCommands = [],
  allowedConfigKeys = [],
  exists,
  files,
  rootDirectory,
  shipped = new Set(),
}) => {
  const allowed = new Set(allowedCommands);
  const allowedKeys = new Set(allowedConfigKeys);
  const bins = new Set(allowedBins);

  const linkEscapes = files.flatMap((file) => {
    const fromDirectory = directoryOf(file.path);
    const links = extractLinkTargets(file.content).map((link) => ({
      ...link,
      ...classifyLink({
        fromDirectory,
        rootDirectory,
        shipped,
        target: link.target,
      }),
    }));
    const tokens =
      exists === undefined
        ? []
        : extractPathTokens(file.content).map((entry) => ({
            line: entry.line,
            target: entry.token,
            ...classifyPathToken({
              exists,
              fromDirectory,
              rootDirectory,
              shipped,
              token: entry.token,
            }),
          }));
    return toEscapes({ classified: [...links, ...tokens], file });
  });

  const commandEscapes = files.flatMap((file) =>
    toCommandEscapes({
      allowed,
      commands: extractCommands(file.content),
      file,
    }),
  );

  const importEscapes = files
    .filter((file) => isSourceFile(file.path))
    .flatMap((file) =>
      extractImportSpecifiers(file.content)
        .map((entry) => ({
          ...entry,
          ...classifyImport({
            fromDirectory: directoryOf(file.path),
            rootDirectory,
            shipped,
            specifier: entry.specifier,
          }),
        }))
        .filter((entry) => entry.kind === 'escape' || entry.kind === 'package')
        .filter((entry) => !allowed.has(entry.specifier))
        .map((entry) => ({
          file: file.path,
          kind: 'import',
          line: entry.line,
          reference: entry.specifier,
          resolved: entry.resolved,
        })),
    );

  const requiresEscapes = files.flatMap((file) =>
    toRequiresEscapes({ allowedKeys, file }),
  );

  const otherEscapes = files.flatMap((file) =>
    artifactEscapes({
      agentDirectory,
      allowed,
      allowedBins: bins,
      containment: {
        fromDirectory: directoryOf(file.path),
        rootDirectory,
        shipped,
      },
      exists,
      file,
    }),
  );

  return {
    escapes: dedupe([
      ...linkEscapes,
      ...commandEscapes,
      ...importEscapes,
      ...requiresEscapes,
      ...otherEscapes,
    ]),
  };
};
