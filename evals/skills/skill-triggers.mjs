/**
 * The pure half of the Claude trigger eval: read a Waza task, and judge a run
 * by which skills the session invoked. The task files are Waza's, so the same
 * suite still runs under `waza run`.
 * Usage: imported by `verify-skill-triggers.mjs`.
 */
import { parse } from 'yaml';

import { wholeNumber } from '../agent-sessions.mjs';

const skillsNamedBy = ({ config = {} }) => [
  ...(config.required_skills ?? []),
  ...(config.forbidden_skills ?? []),
];

export const readEvalSkill = (source) => parse(source)?.skill;

export const readTask = (source) => {
  const task = parse(source);
  return {
    fixture: task.inputs?.context?.fixture,
    graderSkills: (task.graders ?? []).flatMap(skillsNamedBy),
    id: task.id,
    name: task.name,
    prompt: task.inputs.prompt,
    set: task.set,
    shouldTrigger: task.expected?.should_trigger,
    source: task.source,
  };
};

const toolCalls = (messages, name) =>
  messages
    .filter((message) => message.type === 'assistant')
    .flatMap((message) => message.message.content)
    .filter((block) => block.type === 'tool_use' && block.name === name);

export const invokedSkills = (messages) =>
  toolCalls(messages, 'Skill')
    .map((block) => block.input?.skill)
    .filter((skill) => typeof skill === 'string');

export const readPaths = (messages) =>
  toolCalls(messages, 'Read')
    .map((block) => block.input?.file_path)
    .filter((path) => typeof path === 'string');

export const fixtureWasRead = ({ fixtureFiles, read, task }) =>
  task.fixture === undefined ||
  read.some((path) => fixtureFiles.some((file) => path.endsWith(file)));

export const sessionError = (messages) => {
  const result = messages.findLast((message) => message.type === 'result');
  if (result === undefined) {
    return 'the session ended without a result';
  }
  return result.subtype === 'success' && result.is_error !== true
    ? undefined
    : `the session ended with ${result.subtype}`;
};

const unknownNames = ({ known, requested }) =>
  requested.filter((name) => !known.includes(name));

export const selectionProblems = ({ catalog, evals, hidden, requested }) => [
  ...unknownNames({ known: evals, requested }).map(
    (name) => `no eval for "${name}" under evals/skills/`,
  ),
  ...unknownNames({ known: catalog, requested: hidden }).map(
    (name) => `--hide "${name}" names no skill in .github/skills/`,
  ),
];

export const selectedSkills = ({ catalog, evals, hidden, requested }) => {
  const problems = selectionProblems({ catalog, evals, hidden, requested });
  if (problems.length > 0) {
    throw new Error(problems.join('\n'));
  }
  return requested.length === 0 ? evals : requested;
};

const PATHS_KEY = /^paths:/m;

export const isPathScoped = (skillSource) =>
  PATHS_KEY.test(/^---\r?\n([\s\S]*?)\r?\n---/.exec(skillSource)?.[1] ?? '');

const KINDS = [
  { kind: 'trigger', shouldTrigger: true },
  { kind: 'near-miss', shouldTrigger: false },
];

const MINIMUM_TASKS_PER_KIND = 5;

const TASK_SETS = ['regression', 'capability'];

const TASK_SOURCES = ['incident'];

export const PROMPT_SUFFIX =
  "Load any skill you need, but don't run shell commands or edit files.";

const suffixProblems = ({ name, tasks }) =>
  tasks
    .filter(
      (task) =>
        !String(task.prompt ?? '')
          .trimEnd()
          .endsWith(PROMPT_SUFFIX),
    )
    .map(
      (task) =>
        `${name}/${task.id} does not end its prompt with "${PROMPT_SUFFIX}"`,
    );

const skillCoverageProblems = ({ name, scoped, tasks }) => {
  if (tasks === undefined) {
    return [`${name} has no eval under evals/skills/`];
  }
  return [
    ...KINDS.map(({ kind, shouldTrigger }) => ({
      count: tasks.filter((task) => task.shouldTrigger === shouldTrigger)
        .length,
      kind,
    }))
      .filter(({ count }) => count < MINIMUM_TASKS_PER_KIND)
      .map(
        ({ count, kind }) =>
          `${name} has ${count} ${kind} task(s); every skill needs at least ${MINIMUM_TASKS_PER_KIND}`,
      ),
    ...(scoped
      ? tasks
          .filter((task) => task.fixture === undefined)
          .map(
            (task) =>
              `${name}/${task.id} names no fixture, but ${name} has a paths: list, so it is offered only after a matching file is read`,
          )
      : []),
  ];
};

const idProblems = ({ name, tasks }) => [
  ...tasks
    .filter((task) => typeof task.id !== 'string' || task.id === '')
    .map((task) => `${task.file} has no id`),
  ...[
    ...Map.groupBy(
      tasks.filter((task) => typeof task.id === 'string' && task.id !== ''),
      (task) => task.id,
    ),
  ]
    .filter(([, same]) => same.length > 1)
    .map(
      ([id, same]) =>
        `${name} has ${same.length} tasks with id "${id}": ${same.map((task) => task.file).join(', ')}`,
    ),
];

const setProblem = (task) => {
  if (TASK_SETS.includes(task.set)) {
    return [];
  }
  const found =
    task.set === undefined ? 'has no set tag' : `has set "${task.set}"`;
  return [`${task.file} ${found}; give it set: ${TASK_SETS.join(' or set: ')}`];
};

const sourceProblem = (task) =>
  task.source === undefined || TASK_SOURCES.includes(task.source)
    ? []
    : [
        `${task.file} has source "${task.source}"; leave it out, or give it source: ${TASK_SOURCES.join(' or source: ')}`,
      ];

const expectationProblem = (task) => {
  if (typeof task.shouldTrigger === 'boolean') {
    return [];
  }
  const found =
    task.shouldTrigger === undefined
      ? 'has no expected.should_trigger'
      : `has should_trigger ${JSON.stringify(task.shouldTrigger)}`;
  return [
    `${task.file} ${found}; give it expected.should_trigger: true or false`,
  ];
};

const tagProblems = ({ tasks }) =>
  tasks.flatMap((task) => [
    ...expectationProblem(task),
    ...setProblem(task),
    ...sourceProblem(task),
  ]);

const namingProblems = ({ declared, name, tasks }) => [
  ...(declared === name
    ? []
    : [
        `evals/skills/${name}/eval.yaml names skill "${declared}", not "${name}"`,
      ]),
  ...tasks.flatMap((task) =>
    task.graderSkills.length === 0
      ? [`${name}/${task.id} has no grader naming a skill`]
      : task.graderSkills
          .filter((skill) => skill !== name)
          .map(
            (skill) => `${name}/${task.id} grades "${skill}", not "${name}"`,
          ),
  ),
];

export const coverageProblems = ({ catalog, declared, evals }) => {
  const skills = new Set(catalog.map(({ name }) => name));
  return [
    ...catalog.flatMap(({ name, scoped }) =>
      skillCoverageProblems({ name, scoped, tasks: evals.get(name) }),
    ),
    ...[...evals.keys()]
      .filter((name) => !skills.has(name))
      .map((name) => `evals/skills/${name} has no skill under .github/skills/`),
    ...[...evals.entries()].flatMap(([name, tasks]) => [
      ...namingProblems({ declared: declared.get(name), name, tasks }),
      ...idProblems({ name, tasks }),
      ...tagProblems({ tasks }),
      ...suffixProblems({ name, tasks }),
    ]),
  ];
};

export const withoutSeparator = (args) =>
  args[0] === '--' ? args.slice(1) : args;

export const sessionScope = ({ catalog, hidden, task }) => ({
  skills:
    hidden.length === 0
      ? 'all'
      : catalog.filter((name) => !hidden.includes(name)),
  tools: task.fixture === undefined ? ['Skill'] : ['Read', 'Skill'],
});

const sorted = (names) => [...names].toSorted((a, b) => a.localeCompare(b));

const sessionTools = (messages) =>
  messages.find(
    (message) => message.type === 'system' && message.subtype === 'init',
  )?.tools;

const toolList = (names) => sorted(names).join(', ') || 'no tools';

export const scopeError = ({ expectedTools, messages }) => {
  const actual = sessionTools(messages);
  if (actual === undefined) {
    return 'the session reported no tools';
  }
  return toolList(actual) === toolList(expectedTools)
    ? undefined
    : `the session held ${toolList(actual)}, not ${toolList(expectedTools)}`;
};

export const judgeTask = ({ invoked, shouldTrigger, skill }) =>
  invoked.includes(skill) === shouldTrigger;

export const taskPassed = ({ error, fixtureRead, invoked, skill, task }) =>
  error === undefined &&
  fixtureRead &&
  judgeTask({ invoked, shouldTrigger: task.shouldTrigger, skill });

const expectationOf = (task) =>
  task.shouldTrigger ? 'should load' : 'should not load';

const seenOf = (invoked) =>
  invoked.length === 0 ? 'no skill' : invoked.join(', ');

const failureOf = ({ error, fixtureRead }) => {
  if (error !== undefined) {
    return `; error: ${error}`;
  }
  return fixtureRead ? '' : '; the session never read the fixture';
};

const trialOf = (trial) => (trial === undefined ? '' : ` #${trial}`);

export const describeResult = ({
  error,
  fixtureRead,
  invoked,
  passed,
  skill,
  task,
  trial,
}) =>
  `${passed ? 'ok  ' : 'FAIL'} ${skill}/${task.id}${trialOf(trial)}: ${expectationOf(task)}; invoked ${seenOf(invoked)}${failureOf({ error, fixtureRead })}`;

export const trialCount = (value) => wholeNumber({ minimum: 1, value });

const verdictOf = ({ passed, trials }) => {
  if (passed === trials) {
    return 'ok';
  }
  return passed === 0 ? 'fail' : 'flaky';
};

export const taskVerdicts = (results) =>
  [...Map.groupBy(results, ({ skill, task }) => `${skill}/${task.id}`)].map(
    ([name, trials]) => {
      const passed = trials.filter((trial) => trial.passed).length;
      return {
        failed: trials.filter((trial) => !trial.passed),
        name,
        passed,
        trials: trials.length,
        verdict: verdictOf({ passed, trials: trials.length }),
      };
    },
  );

const VERDICT_LABELS = { fail: 'FAIL ', flaky: 'FLAKY', ok: 'ok   ' };

export const describeVerdict = ({ failed, name, passed, trials, verdict }) =>
  [
    `${VERDICT_LABELS[verdict]} ${name}: ${passed}/${trials} trial(s) passed`,
    ...failed.map((result) => `      ${describeResult(result)}`),
  ].join('\n');
