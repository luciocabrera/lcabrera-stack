/*
 * The task block in a consumer's manifest, reconciled one key at a time.
 *
 * Why not the copy it was: the block was written once, when the repository was
 * made, and never looked at again. Adding a task of their own is the first
 * thing a consumer does, and from that moment the whole file read as theirs —
 * so nothing this kit added afterwards ever reached it, silently and for good.
 *
 * A block is a map, which is what makes this tractable where a prose file is
 * not: each key is judged on its own, by the same three-way rule
 * `manifest.mjs` applies to a file's content. The value recorded is the command
 * itself rather than a hash of it, because for a task the value IS the content
 * — one short line, which a consumer reading the record can recognise.
 *
 * The tasks arrive in groups, because they are not all established the same way.
 * `init` wires the gate tasks into any repository — that is what the command is
 * for — while the blueprint's block is written once, by `create`, into a
 * manifest that declares the binaries it names. So a group says whether this run
 * may establish it; a group it may not is written into only where this kit
 * provably wrote it before. The proof is the record, plus a key holding exactly
 * the command this kit ships, which no other run could have put there.
 *
 * What a group does NOT decide is removal. A recorded key is proof of
 * authorship whatever group it came from, so the departed set is read against
 * every name this version ships at any profile — otherwise narrowing the profile
 * would read the rung's own tasks as withdrawn and delete them. The cost of that
 * is a task moved to a rung above the one a consumer is on: it stays in their
 * block, unreported, because this kit still ships it. A stale task is the
 * smaller harm than deleting one whose only fault is that the consumer's profile
 * does not reach it.
 */

import { classifyMaterialisation, isRecorded } from './manifest.mjs';

const REMOVED = 'removed';

const WRITTEN_STATES = new Set(['added', REMOVED, 'restored', 'updated']);

export const isTaskWritten = (state) => WRITTEN_STATES.has(state);

const REPORTED_STATES = new Set(['conflict', 'modified']);

const byName = (left, right) => left.name.localeCompare(right.name);

const adoptedFrom = ({ scripts, tasks }) =>
  Object.fromEntries(
    Object.entries(tasks).filter(
      ([name, command]) => scripts[name] === command,
    ),
  );

const removalState = ({ current, recorded }) => {
  if (current === undefined) return;
  return current === recorded ? REMOVED : 'modified';
};

const recordedFor = ({ names, recorded }) =>
  Object.fromEntries(
    Object.entries(recorded).filter(([name]) => names.has(name)),
  );

const knownFor = ({ recorded, scripts, tasks }) => ({
  ...adoptedFrom({ scripts, tasks }),
  ...recordedFor({ names: new Set(Object.keys(tasks)), recorded }),
});

/**
 * Whether a manifest holds a set of tasks this kit wrote.
 *
 * The same proof the plan runs on, asked on its own: a record, or a key holding
 * exactly the command this kit ships. A run that wires something which only
 * works beside one of these groups asks this first.
 *
 * @param {{ recorded?: Record<string, string>, scripts?: Record<string, string>,
 *           tasks: Record<string, string> }} args
 * @returns {boolean}
 */
export const hasTasksFromKit = ({ recorded = {}, scripts = {}, tasks }) =>
  Object.keys(knownFor({ recorded, scripts, tasks })).length > 0;

const groupPlan = ({ group, recorded, scripts }) => {
  const { establish = false, tasks, withheld = new Set() } = group;
  const known = knownFor({ recorded, scripts, tasks });
  if (!establish && Object.keys(known).length === 0) return [];

  return Object.entries(tasks)
    .filter(([name]) => scripts[name] !== undefined || !withheld.has(name))
    .map(([name, command]) => ({
      command,
      name,
      state: classifyMaterialisation({
        incomingHash: command,
        onDiskHash: scripts[name],
        recordedHash: known[name],
      }),
    }));
};

const namesIn = (groups) => groups.flatMap((group) => Object.keys(group.tasks));

/**
 * What a run would do to each task, and what it would leave alone.
 *
 * @param {{ groups: { establish?: boolean, tasks: Record<string, string>,
 *             withheld?: Set<string> }[],
 *           recorded?: Record<string, string>, scripts?: Record<string, string>,
 *           shipped?: Iterable<string> }} args
 * A group's `withheld` names are the ones whose command does not resolve here,
 * so they are written only where the manifest already holds them. `recorded` is
 * what this kit last wrote, `scripts` what the manifest holds now, and `shipped`
 * every task name this version has at any profile — which defaults to the names
 * the groups carry, so a caller passing every group needs no second argument.
 * @returns {{ command?: string, name: string, state: string }[]}
 */
export const planTasks = ({
  groups,
  recorded = {},
  scripts = {},
  shipped = namesIn(groups),
}) => {
  const planned = groups.flatMap((group) =>
    groupPlan({ group, recorded, scripts }),
  );

  const known = new Set(shipped);
  const dropped = Object.entries(recorded)
    .filter(([name]) => !known.has(name))
    .map(([name, command]) => ({
      name,
      state: removalState({ current: scripts[name], recorded: command }),
    }))
    .filter((entry) => entry.state !== undefined);

  return [...planned, ...dropped].toSorted(byName);
};

/**
 * @param {{ command?: string, name: string, state: string }[]} entries
 * @returns {{ added: string[], skipped: string[] }} the names a run wired, and
 * the ones it left as the consumer has them
 */
export const taskOutcomes = (entries) => ({
  added: entries
    .filter((entry) => entry.state === 'added' || entry.state === 'restored')
    .map((entry) => entry.name),
  skipped: entries
    .filter((entry) => REPORTED_STATES.has(entry.state))
    .map((entry) => entry.name),
});

/**
 * @param {{ entries: { command?: string, name: string, state: string }[],
 *           scripts?: Record<string, string> }} args
 * @returns {Record<string, string>} the block after the plan is applied
 */
export const scriptsAfterTasks = ({ entries, scripts = {} }) => {
  const written = entries.filter((entry) => isTaskWritten(entry.state));
  const removed = new Set(
    written.filter((entry) => entry.state === REMOVED).map(({ name }) => name),
  );
  const merged = {
    ...scripts,
    ...Object.fromEntries(
      written
        .filter((entry) => entry.state !== REMOVED)
        .map(({ command, name }) => [name, command]),
    ),
  };
  return Object.fromEntries(
    Object.entries(merged)
      .filter(([name]) => !removed.has(name))
      .toSorted(([left], [right]) => left.localeCompare(right)),
  );
};

/**
 * The record after the plan is applied, over what it already held.
 *
 * A key left alone keeps the value this kit last wrote there, for the same
 * reason a locally modified file keeps its recorded hash: revert the edit and
 * the next run recognises the value as ours again.
 *
 * @param {{ entries: { command?: string, name: string, state: string }[],
 *           recorded?: Record<string, string> }} args
 * @returns {Record<string, string>}
 */
export const recordedTasks = ({ entries, recorded = {} }) => {
  const next = { ...recorded };
  for (const entry of entries) {
    if (entry.state === REMOVED) delete next[entry.name];
    else if (isRecorded(entry.state)) next[entry.name] = entry.command;
  }
  return next;
};

const STATE_LABELS = {
  added: 'added',
  conflict: 'left alone — a task you wrote is already there',
  current: 'up to date',
  modified: 'left alone — you changed it',
  removed: 'removed — this kit no longer ships it',
  restored: 'restored',
  updated: 'updated',
};

const STATE_COLUMN_WIDTH = Math.max(
  ...Object.keys(STATE_LABELS).map((state) => state.length),
);

export const taskCounts = (entries) => ({
  reported: entries.filter((entry) => REPORTED_STATES.has(entry.state)).length,
  written: entries.filter((entry) => isTaskWritten(entry.state)).length,
});

/**
 * @param {{ command?: string, name: string, state: string }[]} entries
 * @returns {string | undefined} the report, or nothing when a run changed and
 * held back nothing
 */
export const renderTasks = (entries) => {
  const notable = entries.filter(
    (entry) => isTaskWritten(entry.state) || REPORTED_STATES.has(entry.state),
  );
  if (notable.length === 0) return;
  return notable
    .map(
      (entry) =>
        `  ${entry.state.padEnd(STATE_COLUMN_WIDTH)} ${entry.name}  (${STATE_LABELS[entry.state]})`,
    )
    .join('\n');
};
