/*
 * The escapes of the artifacts that are not markdown: workflow files, shell
 * scripts such as hooks, the executables any shipped file invokes, and subagent
 * definitions — and which of those resolvers read a given file at all.
 *
 * Why apart from `closure.mjs`: each kind is read by its own extractor, and a
 * resolver that never fires reports the same clean pass as a file that is
 * genuinely self-contained — so each one is kept small enough to test on its own.
 */

import { extractBinInvocations } from './closure-bins.mjs';
import {
  classifyLink,
  classifyPathToken,
  toCommandEscapes,
  toMissingScripts,
} from './closure-classify.mjs';
import {
  extractProsePathTokens,
  shellCommandWords,
  shellPathTokens,
  shellScriptOperands,
  withoutComment,
} from './closure-extract.mjs';
import { taskInvocations, toTaskEscapes } from './closure-tasks.mjs';
import {
  extractRunScripts,
  extractSecretReferences,
  extractUses,
} from './closure-yaml.mjs';

const WORKFLOW_EXTENSIONS = ['.yaml', '.yml'];

const AUTOMATIC_SECRETS = new Set(['GITHUB_TOKEN']);

const WORKFLOW_JOBS = /^jobs:/m;

const SHELL_SHEBANG = /^#!\S*(?:\/|\s)(?:ba|da|z)?sh\b/;

const isWorkflowFile = ({ content, path }) =>
  WORKFLOW_EXTENSIONS.some((extension) => path.endsWith(extension)) &&
  WORKFLOW_JOBS.test(content);

const isUnder = ({ directory, path }) =>
  directory !== undefined &&
  directory !== '' &&
  path.startsWith(`${directory.replace(/\/$/, '')}/`);

const isAgentFile = ({ agentDirectory, path }) =>
  isUnder({ directory: agentDirectory, path });

const hasExtension = (path) => /\.[^/.]+$/.test(path.split('/').at(-1) ?? '');

const isBareHook = ({ file, hookDirectory }) =>
  isUnder({ directory: hookDirectory, path: file.path }) &&
  !file.content.startsWith('#!') &&
  !hasExtension(file.path);

const isShellScript = ({ file, hookDirectory }) =>
  SHELL_SHEBANG.test(file.content) || isBareHook({ file, hookDirectory });

const toLinkEscape = ({ file, reference }) => ({
  file: file.path,
  kind: 'link',
  line: reference.line,
  reference: reference.target,
  resolved: reference.resolved,
});

const pathEscapes = ({ containment, exists, file, tokens }) =>
  exists === undefined
    ? []
    : tokens
        .map((entry) => ({
          line: entry.line,
          target: entry.token,
          ...classifyPathToken({ ...containment, exists, token: entry.token }),
        }))
        .filter((entry) => entry.kind === 'escape')
        .map((reference) => toLinkEscape({ file, reference }));

const localActionEscapes = ({ containment, file }) =>
  extractUses(file.content)
    .filter((entry) => entry.target.startsWith('.'))
    .map((entry) => ({
      ...entry,
      ...classifyLink({
        ...containment,
        fromDirectory: '',
        target: entry.target,
      }),
    }))
    .filter((entry) => entry.kind === 'escape')
    .map((reference) => toLinkEscape({ file, reference }));

const stepCommandEscapes = ({ allowed, file, scripts }) =>
  toCommandEscapes({ allowed, commands: shellCommandWords(scripts), file });

const stepTaskEscapes = ({ allowedTasks, file, runPrefixes, scripts }) =>
  toTaskEscapes({
    allowedTasks,
    file,
    invocations: taskInvocations({ lines: scripts, prefixes: runPrefixes }),
  });

const stepPathEscapes = ({ containment, exists, file, scripts }) =>
  pathEscapes({
    containment: { ...containment, fromDirectory: '' },
    exists,
    file,
    tokens: shellPathTokens(scripts),
  });

const stepMissingScripts = ({ containment, exists, file, scripts }) =>
  toMissingScripts({
    containment: { ...containment, fromDirectory: '' },
    exists,
    file,
    operands: shellScriptOperands(scripts),
  });

const secretEscapes = ({ file }) =>
  extractSecretReferences(file.content)
    .filter((entry) => !entry.fallback && !AUTOMATIC_SECRETS.has(entry.name))
    .map((entry) => ({
      file: file.path,
      kind: 'secret',
      line: entry.line,
      reference: `secrets.${entry.name}`,
    }));

const workflowEscapes = ({ allowed, containment, exists, file, tasks }) => {
  const scripts = extractRunScripts(file.content);
  return [
    ...localActionEscapes({ containment, file }),
    ...stepCommandEscapes({ allowed, file, scripts }),
    ...stepTaskEscapes({ ...tasks, file, scripts }),
    ...stepPathEscapes({ containment, exists, file, scripts }),
    ...stepMissingScripts({ containment, exists, file, scripts }),
    ...secretEscapes({ file }),
  ];
};

const shellLines = (content) =>
  content.split('\n').map((text, index) => ({
    line: index + 1,
    text: withoutComment(text),
  }));

const shellEscapes = ({ allowed, containment, exists, file, tasks }) => {
  const scripts = shellLines(file.content);
  return [
    ...stepCommandEscapes({ allowed, file, scripts }),
    ...stepTaskEscapes({ ...tasks, file, scripts }),
    ...stepPathEscapes({ containment, exists, file, scripts }),
    ...stepMissingScripts({ containment, exists, file, scripts }),
  ];
};

const binEscapes = ({ allowedBins, file }) =>
  extractBinInvocations(file.content)
    .filter((entry) => !allowedBins.has(entry.name))
    .map((entry) => ({
      file: file.path,
      kind: 'bin',
      line: entry.line,
      reference: entry.name,
    }));

const agentEscapes = ({ containment, exists, file }) =>
  pathEscapes({
    containment,
    exists,
    file,
    tokens: extractProsePathTokens(file.content),
  });

/**
 * @param {{ agentDirectory?: string, hookDirectory?: string,
 *   file: { path: string, content: string } }} args
 * @returns {string[]}
 */
export const artifactReaders = ({ agentDirectory, file, hookDirectory }) =>
  [
    isWorkflowFile(file) && 'workflow',
    isShellScript({ file, hookDirectory }) && 'shell',
    isAgentFile({ agentDirectory, path: file.path }) && 'agent',
  ].filter((reader) => reader !== false);

/**
 * @param {{ agentDirectory?: string, allowed: Set<string>,
 *   allowedBins?: Set<string>, allowedTasks?: Set<string>, containment: object,
 *   exists?: (repoRelativePath: string) => boolean,
 *   file: { path: string, content: string }, hookDirectory?: string,
 *   runPrefixes?: readonly string[] }} args
 */
export const artifactEscapes = ({
  agentDirectory,
  allowed,
  allowedBins,
  allowedTasks,
  containment,
  exists,
  file,
  hookDirectory,
  runPrefixes,
}) => {
  const readers = new Set(
    artifactReaders({ agentDirectory, file, hookDirectory }),
  );
  const tasks = { allowedTasks, runPrefixes };
  return [
    ...(readers.has('workflow')
      ? workflowEscapes({ allowed, containment, exists, file, tasks })
      : []),
    ...(readers.has('shell')
      ? shellEscapes({ allowed, containment, exists, file, tasks })
      : []),
    ...(allowedBins === undefined ? [] : binEscapes({ allowedBins, file })),
    ...(readers.has('agent')
      ? agentEscapes({ containment, exists, file })
      : []),
  ];
};
