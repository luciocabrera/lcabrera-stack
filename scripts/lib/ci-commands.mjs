/**
 * Which `vp run` tasks CI actually executes on a change, derived from the
 * workflows and the root manifest rather than from a list somebody maintains.
 *
 * The requirement register's `met` rule leans on this: a requirement declaring
 * `met` carries a `command` pointer CI runs. Half of that rule is decidable —
 * "does a workflow triggered by a change run this task, directly or through a
 * root script that chains it?" — and this module answers exactly that half. The
 * other half, that the pointer COULD fail, is not derivable from any file here
 * and this module does not pretend to it; see `docs/product/README.md`, which
 * makes it a procedure for the author and the reviewer.
 *
 * Two deliberate limits, both of which make this UNDER-report rather than
 * over-report: only a task named literally after `vp run` is seen (not one
 * behind `--filter`), and a path-filtered workflow counts, because whether its
 * filter covers a given change is a per-change question. A gate that flatters a
 * pointer is the failure mode to avoid, so where it cannot tell, it is silent.
 *
 * Everything here is pure — callers read the files.
 */

/**
 * Triggers that fire on a change to the repository. A `schedule`- or
 * `workflow_dispatch`-only workflow is real CI, but it does not run against the
 * commit that declares the requirement, so it cannot be what a `met` claim
 * rests on.
 */
export const GATING_TRIGGERS = new Set(['merge_group', 'pull_request', 'push']);

const indentOf = (line) => line.length - line.trimStart().length;

/** YAML reads a bare `on` as the boolean true, so a workflow may quote it. */
const ON_KEY = /^(?:on|'on'|"on"):(.*)$/;

/** A step's `run:`, with or without the `- ` that opens an unnamed step. The
 *  captured prefix is the indent a block scalar's lines must exceed. */
const STEP_RUN = /^(\s*(?:-\s+)?)run:(.*)$/;

/**
 * The trigger names a workflow declares. Handles both `on: [push]` and the
 * block form; a nested key such as `types:` is never at the block's own indent,
 * so only the trigger names are collected.
 */
export const workflowTriggers = (source) => {
  const lines = source.split('\n');
  const start = lines.findIndex((line) => ON_KEY.test(line));
  if (start === -1) {
    return new Set();
  }
  const inline = ON_KEY.exec(lines[start])?.[1].trim() ?? '';
  if (inline !== '') {
    return new Set(
      inline
        .replaceAll(/[[\]]/g, '')
        .split(',')
        .map((name) => name.trim())
        .filter((name) => name !== ''),
    );
  }
  const triggers = new Set();
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === '' || line.trim().startsWith('#')) {
      continue;
    }
    if (indentOf(line) === 0) {
      break;
    }
    const name = /^\s{2}([a-z_]+):/.exec(line)?.[1];
    if (name !== undefined) {
      triggers.add(name);
    }
  }
  return triggers;
};

/**
 * The shell text of every `run:` step. Read rather than grepping the whole
 * file, because a workflow COMMENT naming a repair command must not count as
 * CI running it — that is the difference between a check and the appearance of
 * one.
 */
export const runStepBodies = (source) => {
  const lines = source.split('\n');
  const bodies = [];
  let block;
  for (const line of lines) {
    if (
      block !== undefined &&
      (line.trim() === '' || indentOf(line) > block.indent)
    ) {
      block.text.push(line.trim());
      continue;
    }
    block = undefined;
    const step = STEP_RUN.exec(line);
    if (step === null) {
      continue;
    }
    const rest = step[2].trim();
    if (rest.startsWith('|') || rest.startsWith('>')) {
      block = { indent: step[1].length, text: [] };
      bodies.push(block.text);
      continue;
    }
    bodies.push([rest]);
  }
  return bodies.map((text) =>
    text.filter((line) => !line.startsWith('#')).join('\n'),
  );
};

/** Every `vp run <task>` named in a piece of shell. */
export const commandsIn = (text) =>
  [...text.matchAll(/vp run ([a-z][\w:-]*)/g)].map(([, task]) => task);

/**
 * The tasks CI runs, closed over the root manifest: a workflow step that runs
 * `vp run test:ci` also runs everything `test:ci` chains, which is how a
 * pointer at a task CI never names by hand still resolves.
 *
 * `workflows` are `{ source }` records; `rootScripts` is the root package.json
 * `scripts` object.
 */
export const commandsRunByCi = ({ rootScripts, workflows }) => {
  const gating = workflows.filter((workflow) =>
    [...workflowTriggers(workflow.source)].some((trigger) =>
      GATING_TRIGGERS.has(trigger),
    ),
  );
  const run = new Set(
    gating.flatMap((workflow) =>
      runStepBodies(workflow.source).flatMap((body) => commandsIn(body)),
    ),
  );
  const scripts = new Map(Object.entries(rootScripts));
  const pending = [...run];
  while (pending.length > 0) {
    const task = pending.pop();
    for (const chained of commandsIn(scripts.get(task) ?? '')) {
      if (!run.has(chained)) {
        run.add(chained);
        pending.push(chained);
      }
    }
  }
  return run;
};
