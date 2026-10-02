/**
 * The pure half of the Claude trigger eval: read a Waza task, and judge a run
 * by which skills the session invoked. The task files are Waza's, so the same
 * suite still runs under `waza run`.
 * Usage: imported by `verify-skill-triggers.mjs`.
 */
import { parse } from 'yaml';

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
    shouldTrigger: task.expected.should_trigger === true,
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

const REQUIRED_TASKS = ['trigger', 'near-miss'];

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
  const ids = new Set(tasks.map((task) => task.id));
  return [
    ...REQUIRED_TASKS.filter((id) => !ids.has(id)).map(
      (id) => `${name} has no ${id} task`,
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
      ...suffixProblems({ name, tasks }),
    ]),
  ];
};

export const withoutSeparator = (args) =>
  args[0] === '--' ? args.slice(1) : args;

export const chunk = (items, size) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );

export const errorText = (error) =>
  error instanceof Error ? error.message : String(error);

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

export const describeResult = ({
  error,
  fixtureRead,
  invoked,
  passed,
  skill,
  task,
}) =>
  `${passed ? 'ok  ' : 'FAIL'} ${skill}/${task.id}: ${expectationOf(task)}; invoked ${seenOf(invoked)}${failureOf({ error, fixtureRead })}`;
