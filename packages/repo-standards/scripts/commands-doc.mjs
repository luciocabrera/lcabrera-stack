/*
 * Reading a command reference: which tasks it documents, and where a repository
 * runs its tasks from.
 *
 * Split out of the gate so every judgement is reachable from a test with
 * literal values, and because both of them are the consumer's fact rather than
 * this package's. A repository that runs a task with `npm run` documents it
 * that way, and a gate holding out for one runner's spelling reports every task
 * in the file as undocumented — with a remedy that is already done. The same
 * split decides where the task list comes from: only a toolchain that resolves
 * tasks from more than the manifests has to be asked for it.
 */

export const DEFAULT_RUN_PREFIX = 'vp run';

const VITE_PLUS = 'vp';

const REGEXP_SPECIAL = /[$()*+.?[\\\]^{|}]/g;

const runnerWord = (runPrefix) => runPrefix.trim().split(/\s+/, 1)[0] ?? '';

const matchedLiterally = (value) =>
  value
    .replaceAll(REGEXP_SPECIAL, String.raw`\$&`)
    .replaceAll(/\s+/g, String.raw`\s+`);

/**
 * Whether the task list has to be asked for rather than read.
 *
 * `npm`, `pnpm`, `yarn` and `bun` run the manifests and nothing else, so the
 * manifests are the whole truth for them. Vite+ resolves a task from three
 * places — a manifest script, a config's own tasks, and the shared factories a
 * config composes — so reading manifests there would report a real task as
 * missing.
 *
 * @param {string} runPrefix
 * @returns {boolean}
 */
export const requiresRunnerTaskList = (runPrefix) =>
  runnerWord(runPrefix) === VITE_PLUS;

/**
 * @param {{ doc: string, runPrefix?: string }} args
 * @returns {Set<string>} every task the document spells as a run command
 */
export const documentedTasks = ({ doc, runPrefix = DEFAULT_RUN_PREFIX }) => {
  const word = runPrefix.trim();
  if (word === '') return new Set();
  const pattern = new RegExp(
    String.raw`${matchedLiterally(word)}\s+([a-z][\w:-]*)`,
    'g',
  );
  return new Set(doc.matchAll(pattern).map(([, task]) => task));
};

/**
 * @param {{ docName: string, documented: Set<string>, rootScripts: string[],
 *           runPrefix?: string }} args
 * @returns {string[]} one problem per root script the document does not carry
 */
export const undocumentedScripts = ({
  docName,
  documented,
  rootScripts,
  runPrefix = DEFAULT_RUN_PREFIX,
}) =>
  rootScripts
    .filter((script) => !documented.has(script))
    .map(
      (script) =>
        `${docName} does not document the root script \`${script}\` — write it in as \`${runPrefix} ${script}\`, or delete the script.`,
    );

/**
 * @param {{ docName: string, documented: Set<string>, runPrefix?: string,
 *           tasks: Set<string> }} args
 * @returns {string[]} one problem per documented command that resolves to no task
 */
export const unresolvedDocumented = ({
  docName,
  documented,
  runPrefix = DEFAULT_RUN_PREFIX,
  tasks,
}) =>
  [...documented]
    .filter((task) => !tasks.has(task))
    .map(
      (task) =>
        `${docName} documents \`${runPrefix} ${task}\`, which is not a task in any workspace — it was renamed or removed.`,
    );
