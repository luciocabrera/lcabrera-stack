/*
 * The escapes of the artifacts that are not markdown: workflow files, the
 * executables any shipped file invokes, and subagent definitions.
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
} from './closure-classify.mjs';
import {
  extractProsePathTokens,
  shellCommandWords,
  shellPathTokens,
} from './closure-extract.mjs';
import {
  extractRunScripts,
  extractSecretReferences,
  extractUses,
} from './closure-yaml.mjs';

const WORKFLOW_EXTENSIONS = ['.yaml', '.yml'];

const AUTOMATIC_SECRETS = new Set(['GITHUB_TOKEN']);

export const isWorkflowFile = (path) =>
  WORKFLOW_EXTENSIONS.some((extension) => path.endsWith(extension));

export const isAgentFile = ({ agentDirectory, path }) =>
  agentDirectory !== undefined &&
  agentDirectory !== '' &&
  path.startsWith(`${agentDirectory.replace(/\/$/, '')}/`);

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

const stepPathEscapes = ({ containment, exists, file, scripts }) =>
  pathEscapes({
    containment: { ...containment, fromDirectory: '' },
    exists,
    file,
    tokens: shellPathTokens(scripts),
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

const workflowEscapes = ({ allowed, containment, exists, file }) => {
  const scripts = extractRunScripts(file.content);
  return [
    ...localActionEscapes({ containment, file }),
    ...stepCommandEscapes({ allowed, file, scripts }),
    ...stepPathEscapes({ containment, exists, file, scripts }),
    ...secretEscapes({ file }),
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
 * @param {{ agentDirectory?: string, allowed: Set<string>,
 *   allowedBins: Set<string>, containment: object,
 *   exists?: (repoRelativePath: string) => boolean,
 *   file: { path: string, content: string } }} args
 */
export const artifactEscapes = ({
  agentDirectory,
  allowed,
  allowedBins,
  containment,
  exists,
  file,
}) => [
  ...(isWorkflowFile(file.path)
    ? workflowEscapes({ allowed, containment, exists, file })
    : []),
  ...binEscapes({ allowedBins, file }),
  ...(isAgentFile({ agentDirectory, path: file.path })
    ? agentEscapes({ containment, exists, file })
    : []),
];
