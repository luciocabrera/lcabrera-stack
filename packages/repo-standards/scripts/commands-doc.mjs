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
 *
 * The prefix is matched from its left edge, because one runner's name ends
 * another's: unanchored, the shorter spelling matches inside the longer one, and
 * both checks below then answer for a command the document does not carry.
 *
 * The filter check reads Vite+ commands only. Its `--filter` warns and exits 0
 * when it matches no package, `--fail-if-no-match` is what makes that an error,
 * and only the options before the task name reach the runner; another runner
 * spells its filter elsewhere, so the check does not guess at it.
 */

export const DEFAULT_RUN_PREFIX = 'vp run';

const VITE_PLUS = 'vp';

const REGEXP_SPECIAL = /[$()*+.?[\\\]^{|}]/g;

const runnerWord = (runPrefix) => runPrefix.trim().split(/\s+/, 1)[0] ?? '';

const matchedLiterally = (value) =>
  value
    .replaceAll(REGEXP_SPECIAL, String.raw`\$&`)
    .replaceAll(/\s+/g, String.raw`\s+`);

const LEFT_EDGE = String.raw`(?<!\w)`;

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
    String.raw`${LEFT_EDGE}${matchedLiterally(word)}\s+([a-z][\w:-]*)`,
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

const FAIL_IF_NO_MATCH = '--fail-if-no-match';

const FILTER_OPTIONS = new Set(['--filter', '-F']);

const VALUED_OPTIONS = new Set([
  ...FILTER_OPTIONS,
  '--concurrency-limit',
  '--log',
]);

const COMMAND_SEPARATOR = /&&|\|\||[\n;|]/;

const LINE_CONTINUATION = /\\\n/g;

const isFilter = (option) =>
  FILTER_OPTIONS.has(option) || option.startsWith('--filter=');

const runnerOptions = (invocation) => {
  const tokens = invocation.trim().split(/\s+/);
  const options = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === '--' || !token.startsWith('-')) break;
    options.push(token);
    if (VALUED_OPTIONS.has(token)) index += 1;
  }
  return options;
};

const isUnguarded = (options) =>
  options.some((option) => isFilter(option)) &&
  !options.includes(FAIL_IF_NO_MATCH);

/**
 * @param {{ commands: Array<{ source: string, where: string }>,
 *           runPrefix?: string }} args
 * @returns {string[]} one problem per filtered run that passes when its filter
 *   matches no package
 */
export const unguardedFilters = ({
  commands,
  runPrefix = DEFAULT_RUN_PREFIX,
}) => {
  if (!requiresRunnerTaskList(runPrefix)) return [];
  const word = runPrefix.trim();
  const invocation = new RegExp(
    String.raw`${LEFT_EDGE}${matchedLiterally(word)}(?=\s)`,
  );
  return commands.flatMap(({ source, where }) =>
    source
      .replaceAll(LINE_CONTINUATION, ' ')
      .split(COMMAND_SEPARATOR)
      .flatMap((segment) => segment.split(invocation).slice(1))
      .filter((rest) => isUnguarded(runnerOptions(rest)))
      .map(
        (rest) =>
          `${where} runs \`${word} ${rest.trim()}\` without \`${FAIL_IF_NO_MATCH}\` — a filter that matches no package then passes having run nothing. Add the flag before the task name.`,
      ),
  );
};
