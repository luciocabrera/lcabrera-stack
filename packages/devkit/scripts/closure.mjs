/*
 * Answers one question about a directory that is about to be shipped: what does
 * it need that it does not contain?
 *
 * Pure by design: callers pass file contents in and get findings back, so the
 * walking, printing and exit code live in the CLI. Escapes are reported by kind
 * because they fail differently for a consumer — a `link` is a file they will
 * not have, a `command` a tool their shell may not resolve, an `import` a module
 * their install will not provide, a `bin` an executable their install will not
 * place, a `secret` a value only their repository settings can supply, a
 * `requires` a config key no consumer could set, a `missing` a script run by a
 * command that exists nowhere at all, and a `task` a runner invocation naming a
 * task the shipped set never defines.
 *
 * A file no resolver reads is returned as `unchecked` rather than dropped: the
 * analysis finds nothing in it for the same reason it finds nothing in a file
 * that is genuinely self-contained, so only naming it tells the two apart.
 */

import { artifactEscapes, artifactReaders } from './closure-artifacts.mjs';
import {
  classifyImport,
  classifyLink,
  classifyPathToken,
  directoryOf,
  toCommandEscapes,
  toMissingScripts,
} from './closure-classify.mjs';
import {
  extractCommands,
  extractImportSpecifiers,
  extractLinkTargets,
  extractPathTokens,
  extractScriptOperands,
} from './closure-extract.mjs';
import { extractTaskInvocations, toTaskEscapes } from './closure-tasks.mjs';
import { requiredConfigKeys, requiresDeclarationLine } from './frontmatter.mjs';

export { classifyLink, classifyPathToken } from './closure-classify.mjs';

const SOURCE_EXTENSIONS = [
  '.cjs',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.mts',
  '.ts',
  '.tsx',
];

const MARKDOWN_EXTENSIONS = ['.md', '.mdx'];

const isSourceFile = (path) =>
  SOURCE_EXTENSIONS.some((extension) => path.endsWith(extension));

const isMarkdownFile = (path) =>
  MARKDOWN_EXTENSIONS.some((extension) => path.endsWith(extension));

const isRead = ({ agentDirectory, file, hookDirectory }) =>
  isMarkdownFile(file.path) ||
  isSourceFile(file.path) ||
  artifactReaders({ agentDirectory, file, hookDirectory }).length > 0;

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
 *   allowedPackages?: Iterable<string>,
 *   allowedTasks?: Iterable<string>,
 *   exists?: (repoRelativePath: string) => boolean,
 *   hookDirectory?: string,
 *   runPrefixes?: readonly string[],
 *   shipped?: Set<string> }} args
 */
export const analyseClosure = ({
  agentDirectory,
  allowedBins,
  allowedCommands = [],
  allowedConfigKeys = [],
  allowedPackages = [],
  allowedTasks,
  exists,
  files,
  hookDirectory,
  rootDirectory,
  runPrefixes,
  shipped = new Set(),
}) => {
  const allowed = new Set(allowedCommands);
  const tasks = allowedTasks === undefined ? undefined : new Set(allowedTasks);
  const allowedKeys = new Set(allowedConfigKeys);
  const packages = new Set(allowedPackages);
  const bins = allowedBins === undefined ? undefined : new Set(allowedBins);

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

  const taskEscapes = files
    .filter((file) => isMarkdownFile(file.path))
    .flatMap((file) =>
      toTaskEscapes({
        allowedTasks: tasks,
        file,
        invocations: extractTaskInvocations({
          content: file.content,
          prefixes: runPrefixes,
        }),
      }),
    );

  const missingScripts = files.flatMap((file) =>
    toMissingScripts({
      containment: {
        fromDirectory: directoryOf(file.path),
        rootDirectory,
        shipped,
      },
      exists,
      file,
      operands: extractScriptOperands(file.content),
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
        .filter((entry) => !packages.has(entry.packageName))
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
      allowedTasks: tasks,
      containment: {
        fromDirectory: directoryOf(file.path),
        rootDirectory,
        shipped,
      },
      exists,
      file,
      hookDirectory,
      runPrefixes,
    }),
  );

  const unchecked = files
    .filter((file) => !isRead({ agentDirectory, file, hookDirectory }))
    .map((file) => file.path)
    .toSorted((left, right) => left.localeCompare(right));

  return {
    escapes: dedupe([
      ...linkEscapes,
      ...commandEscapes,
      ...taskEscapes,
      ...missingScripts,
      ...importEscapes,
      ...requiresEscapes,
      ...otherEscapes,
    ]),
    unchecked,
  };
};
