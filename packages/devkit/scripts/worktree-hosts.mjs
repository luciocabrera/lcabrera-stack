/*
 * The two facts `devkit worktrees` needs from outside git: a branch's pull
 * request state from the code host's CLI, and the throwaway containers from the
 * container engine. Either may be missing, unauthenticated or offline; each
 * answer then carries the reason, so the plan can keep what it could not decide
 * and say why.
 */

import { resolveTool, runTool } from './host-tool.mjs';
import { PR_STATES } from './worktree-plan.mjs';

export const THROWAWAY_LABEL = 'devkit.throwaway';

const PR_FIELDS = 'number,state,headRefOid';

const unknown = (reason) => ({ reason, state: PR_STATES.unknown });

const parseJson = (text) => {
  try {
    return { value: JSON.parse(text) };
  } catch {
    return { value: undefined };
  }
};

/**
 * @param {{ headRefOid?: string, number: number, state: string }[]} prs
 */
export const summarisePullRequests = (prs) => {
  const byState = (state) =>
    prs.find((pr) => String(pr.state).toUpperCase() === state);
  const chosen =
    byState(PR_STATES.open) ??
    byState(PR_STATES.merged) ??
    byState(PR_STATES.closed);
  if (chosen === undefined) return { state: PR_STATES.none };
  return {
    headRefOid: chosen.headRefOid,
    number: chosen.number,
    state: String(chosen.state).toUpperCase(),
  };
};

const readPullRequests = ({ args, cwd, gh }) => {
  const result = runTool({ args, binary: gh, cwd });
  if (!result.ok) return { error: result.reason };
  const { value } = parseJson(result.stdout);
  return Array.isArray(value)
    ? { prs: value }
    : { error: 'gh answered something other than a list of pull requests' };
};

const queryFor = ({ branch, head }) =>
  branch === undefined
    ? ['pr', 'list', '--state', 'all', '--search', head, '--json', PR_FIELDS]
    : ['pr', 'list', '--state', 'all', '--head', branch, '--json', PR_FIELDS];

const matchingHead = ({ branch, head, prs }) =>
  branch === undefined ? prs.filter((pr) => pr.headRefOid === head) : prs;

/**
 * @param {{ cwd: string, gh: string | undefined }} args
 * @returns {(target: { branch?: string, head: string }) => object}
 */
export const pullRequestReader = ({ cwd, gh }) => {
  let failure = gh === undefined ? 'gh is not installed' : undefined;
  return (target) => {
    if (failure !== undefined) return unknown(failure);
    const { error, prs = [] } = readPullRequests({
      args: queryFor(target),
      cwd,
      gh,
    });
    if (error !== undefined) {
      failure = `gh could not answer (${error})`;
      return unknown(failure);
    }
    return summarisePullRequests(matchingHead({ ...target, prs }));
  };
};

const labelValue = (labels = '') =>
  String(labels)
    .split(',')
    .map((pair) => pair.split('='))
    .find(([key]) => key === THROWAWAY_LABEL)?.[1] ?? '';

/**
 * @param {string} output
 */
export const parseContainers = (output) =>
  output
    .split('\n')
    .map((line) => parseJson(line.trim()).value)
    .filter((entry) => entry !== undefined && entry !== null)
    .map((entry) => ({
      id: String(entry.ID ?? ''),
      name: String(entry.Names ?? entry.ID ?? ''),
      running: String(entry.State ?? '').toLowerCase() === 'running',
      worktree: labelValue(entry.Labels),
    }));

/**
 * @param {{ cwd: string, docker: string | undefined }} args
 * @returns {{ containers: object[], error?: string }}
 */
const listThrowawayContainers = ({ cwd, docker }) => {
  if (docker === undefined) {
    return { containers: [], error: 'docker is not installed' };
  }
  const result = runTool({
    args: [
      'ps',
      '-a',
      '--filter',
      `label=${THROWAWAY_LABEL}`,
      '--format',
      '{{json .}}',
    ],
    binary: docker,
    cwd,
    timeout: 20_000,
  });
  return result.ok
    ? { containers: parseContainers(result.stdout) }
    : {
        containers: [],
        error: `docker could not list containers (${result.reason})`,
      };
};

/**
 * @param {{ directories?: string[], pathEntries?: string[] }} [locations]
 */
export const systemHosts = (locations = {}) => {
  const docker = resolveTool({ ...locations, name: 'docker' });
  const gh = resolveTool({ ...locations, name: 'gh' });
  return {
    containers: (cwd) => listThrowawayContainers({ cwd, docker }),
    pullRequests: (cwd) => pullRequestReader({ cwd, gh }),
    removeContainer: ({ cwd, id }) =>
      docker === undefined
        ? { ok: false, reason: 'docker is not installed' }
        : runTool({ args: ['rm', '-f', id], binary: docker, cwd }),
  };
};
