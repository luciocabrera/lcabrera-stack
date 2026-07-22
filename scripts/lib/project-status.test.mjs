import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { targetStatus } from './project-status.mjs';

// This map decides what the Planning board says, and it had no tests — a pure
// function extracted specifically to be testable (its own header says so) while
// every other pure helper here has a colocated suite. A missing transition is
// invisible in a function nothing exercises, which is how `issues: closed` went
// unmapped until two cards were found stuck in In Progress (#249, #255, #307).

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WORKFLOW = '.github/workflows/project-status.yml';

const issue = (action) =>
  targetStatus({ eventName: 'issues', payload: { action } });

const pull = (action, pr) =>
  targetStatus({
    eventName: 'pull_request',
    payload: { action, pull_request: pr },
  });

describe('issue events', () => {
  it('starts work when someone self-assigns', () => {
    expect(issue('assigned')).toBe('In Progress');
  });

  it('finishes the card when the issue closes, PR or no PR', () => {
    // The defect: a merging PR moves the issues it closes, but an issue closed
    // by hand emitted an event nothing subscribed to, so its card stayed put.
    expect(issue('closed')).toBe('Done');
  });

  it('returns a reopened issue to the backlog, not to In Progress', () => {
    // Assigning is what says someone has started; reopening only says the work
    // is not finished.
    expect(issue('reopened')).toBe('Todo');
  });

  it.each(['labeled', 'edited', 'unassigned', 'milestoned', 'transferred'])(
    'ignores %s',
    (action) => {
      expect(issue(action)).toBeUndefined();
    },
  );
});

describe('pull request events', () => {
  it('moves a merged PR to Done', () => {
    expect(pull('closed', { merged: true })).toBe('Done');
  });

  it('returns an abandoned PR to the backlog', () => {
    expect(pull('closed', { merged: false })).toBe('Todo');
  });

  it('treats a new draft as work underway and a new non-draft as reviewable', () => {
    expect(pull('opened', { draft: true })).toBe('In Progress');
    expect(pull('opened', { draft: false })).toBe('In Review');
    expect(pull('reopened', { draft: true })).toBe('In Progress');
    expect(pull('converted_to_draft', { draft: true })).toBe('In Progress');
  });

  it('moves a PR marked ready into review', () => {
    expect(pull('ready_for_review', { draft: false })).toBe('In Review');
  });

  it.each(['synchronize', 'labeled', 'assigned'])('ignores %s', (action) => {
    expect(pull(action, { draft: false })).toBeUndefined();
  });
});

describe('unrelated events', () => {
  it.each(['push', 'workflow_dispatch', 'schedule', 'issue_comment'])(
    'ignores %s',
    (eventName) => {
      expect(
        targetStatus({ eventName, payload: { action: 'closed' } }),
      ).toBeUndefined();
    },
  );

  it('accepts pull_request_target on the same terms as pull_request', () => {
    expect(
      targetStatus({
        eventName: 'pull_request_target',
        payload: { action: 'closed', pull_request: { merged: true } },
      }),
    ).toBe('Done');
  });
});

describe('the workflow subscribes to what the map handles', () => {
  // A mapped transition the workflow does not listen for is dead code that
  // looks live: the test above passes and the card never moves — exactly the
  // shape of the original defect.
  const workflow = () => readFileSync(join(REPO_ROOT, WORKFLOW), 'utf8');

  const subscribedTypes = (block) => {
    const match = new RegExp(
      String.raw`\n  ${block}:\n    types: \[(.+)\]`,
    ).exec(workflow());
    expect(
      match,
      `no \`types:\` list for \`${block}\` in ${WORKFLOW}`,
    ).not.toBeNull();
    return match[1].split(',').map((type) => type.trim());
  };

  it('listens for every issue action the map answers', () => {
    const subscribed = subscribedTypes('issues');
    for (const action of ['assigned', 'closed', 'reopened']) {
      expect(
        subscribed,
        `${WORKFLOW} must subscribe to issues: ${action}`,
      ).toContain(action);
      expect(issue(action)).toBeDefined();
    }
  });

  it('listens for every pull_request action the map answers', () => {
    const subscribed = subscribedTypes('pull_request');
    for (const action of [
      'opened',
      'reopened',
      'ready_for_review',
      'converted_to_draft',
      'closed',
    ]) {
      expect(subscribed).toContain(action);
    }
  });
});
