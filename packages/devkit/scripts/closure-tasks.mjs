/*
 * The tasks a shipped file runs through a package runner, and which of them the
 * receiving repository will not have.
 *
 * Apart from the command check because the two fail differently: `npm` resolves
 * on every machine, so a file naming it passes that check, while the task after
 * `npm run` exists only where some manifest defines it. Only the task word tells
 * a runnable instruction from one that names the originating repository's
 * tooling. Pure: the caller says which tasks are defined and which lines to read.
 */

import {
  shellCodeLines,
  shellSegments,
  withoutComment,
} from './closure-extract.mjs';

export const RUNNER_PREFIXES = Object.freeze([
  'bun run',
  'npm run',
  'pnpm run',
  'vp run',
  'yarn run',
  '{{commands.run}}',
]);

const TASK_NAME = /^[a-z][\w:.-]*$/i;

const ASSIGNMENT = /^[A-Za-z_]\w*=/;

const wordsOf = (text) => text.split(/\s+/).filter((word) => word !== '');

const startsWith = ({ prefix, words }) =>
  prefix.every((word, index) => words[index] === word);

const taskAfter = ({ prefixes, segment }) => {
  const words = wordsOf(segment);
  const command = words.slice(
    Math.max(
      words.findIndex((word) => !ASSIGNMENT.test(word)),
      0,
    ),
  );
  const prefix = prefixes.find((candidate) =>
    startsWith({ prefix: candidate, words: command }),
  );
  return prefix === undefined ? '' : (command[prefix.length] ?? '');
};

/**
 * @param {{ lines: { line: number, text: string }[],
 *   prefixes?: readonly string[] }} args
 * @returns {{ line: number, task: string }[]}
 */
export const taskInvocations = ({ lines, prefixes = RUNNER_PREFIXES }) => {
  const split = prefixes.map((prefix) => wordsOf(prefix));
  return lines.flatMap(({ line, text }) =>
    shellSegments(withoutComment(text))
      .map((segment) => taskAfter({ prefixes: split, segment }))
      .filter((task) => TASK_NAME.test(task))
      .map((task) => ({ line, task })),
  );
};

/**
 * @param {{ content: string, prefixes?: readonly string[] }} args
 * @returns {{ line: number, task: string }[]}
 */
export const extractTaskInvocations = ({ content, prefixes }) =>
  taskInvocations({ lines: shellCodeLines(content), prefixes });

/**
 * @param {{ allowedTasks?: Set<string>, file: { path: string },
 *   invocations: { line: number, task: string }[] }} args
 */
export const toTaskEscapes = ({ allowedTasks, file, invocations }) =>
  allowedTasks === undefined
    ? []
    : invocations
        .filter((invocation) => !allowedTasks.has(invocation.task))
        .map((invocation) => ({
          file: file.path,
          kind: 'task',
          line: invocation.line,
          reference: invocation.task,
        }));
