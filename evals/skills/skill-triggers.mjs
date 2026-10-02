/**
 * The pure half of the Claude trigger eval: read a Waza task, and judge a run
 * by which skills the session invoked. The task files are Waza's, so the same
 * suite still runs under `waza run`.
 * Usage: imported by `verify-skill-triggers.mjs`.
 */
import { parse } from 'yaml';

export const readTask = (source) => {
  const task = parse(source);
  return {
    fixture: task.inputs?.context?.fixture,
    id: task.id,
    name: task.name,
    prompt: task.inputs.prompt,
    shouldTrigger: task.expected.should_trigger === true,
  };
};

export const invokedSkills = (messages) =>
  messages
    .filter((message) => message.type === 'assistant')
    .flatMap((message) => message.message.content)
    .filter((block) => block.type === 'tool_use' && block.name === 'Skill')
    .map((block) => block.input?.skill)
    .filter((skill) => typeof skill === 'string');

export const errorText = (error) =>
  error instanceof Error ? error.message : String(error);

export const sessionScope = ({ catalog, hidden, task }) => ({
  skills:
    hidden.length === 0
      ? 'all'
      : catalog.filter((name) => !hidden.includes(name)),
  tools: task.fixture === undefined ? ['Skill'] : ['Read', 'Skill'],
});

export const judgeTask = ({ invoked, shouldTrigger, skill }) =>
  invoked.includes(skill) === shouldTrigger;

export const taskPassed = ({ error, invoked, skill, task }) =>
  error === undefined &&
  judgeTask({ invoked, shouldTrigger: task.shouldTrigger, skill });

const expectationOf = (task) =>
  task.shouldTrigger ? 'should load' : 'should not load';

const seenOf = (invoked) =>
  invoked.length === 0 ? 'no skill' : invoked.join(', ');

const failureOf = (error) =>
  error === undefined ? '' : `; session error: ${error}`;

export const describeResult = ({ error, invoked, passed, skill, task }) =>
  `${passed ? 'ok  ' : 'FAIL'} ${skill}/${task.id}: ${expectationOf(task)}; invoked ${seenOf(invoked)}${failureOf(error)}`;
