/**
 * Keeps the Planning project's **Status** field in sync with what is actually
 * happening, so the board reflects reality without anyone dragging cards.
 *
 * The board was going stale because status was manual: an agent works in its own
 * tree and the linked issue sits in the backlog until a PR appears. This closes
 * that gap by reacting to the events GitHub already emits, driven from a workflow:
 *
 *   - issue **assigned**              → In Progress  (self-assign = "I've started")
 *   - PR opened/reopened as **draft** → In Progress  (work is underway)
 *   - PR **ready for review**         → In Review
 *   - PR **converted back to draft**  → In Progress
 *   - PR **merged**                   → Done
 *   - PR **closed unmerged**          → back to the backlog
 *
 * For a PR it updates the PR's own card **and** every issue the PR closes
 * (`closingIssuesReferences`), so the backlog issue moves even though the PR is
 * the thing that changed. Items not yet on the board are added first
 * (`addProjectV2ItemById` is idempotent), so a brand-new PR still lands correctly.
 *
 * Effects (the GraphQL calls) are at the edges; the event→status decision is the
 * pure `targetStatus` in `./lib/project-status.mjs`. No `child_process` — it talks
 * to the GraphQL API over `fetch`, so nothing is resolved through PATH (Sonar
 * S4036), the same shape as `sonar-report.mjs`.
 *
 * Env: GH_PROJECT_TOKEN (a PAT with `project` + `repo`), PROJECT_OWNER,
 * PROJECT_NUMBER. GITHUB_EVENT_NAME / GITHUB_EVENT_PATH are set by Actions.
 *
 * Usage (from a workflow): node scripts/sync-project-status.mjs
 * Exit codes: 0 = done or nothing to do / no token (fork PR); 1 = an API error.
 */
import { readFileSync } from 'node:fs';

import { targetStatus } from './lib/project-status.mjs';

const GRAPHQL_URL = 'https://api.github.com/graphql';

const graphql = async ({ query, token, variables }) => {
  const response = await fetch(GRAPHQL_URL, {
    body: JSON.stringify({ query, variables }),
    headers: {
      authorization: `bearer ${token}`,
      'content-type': 'application/json',
    },
    method: 'POST',
  });
  const body = await response.json();
  if (body.errors) {
    throw new Error(`GraphQL: ${body.errors.map((e) => e.message).join('; ')}`);
  }
  return body.data;
};

const PROJECT_META_QUERY = `
  query ($owner: String!, $number: Int!) {
    user(login: $owner) {
      projectV2(number: $number) {
        id
        field(name: "Status") {
          ... on ProjectV2SingleSelectField { id options { id name } }
        }
      }
    }
  }`;

const resolveProjectMeta = async ({ number, owner, token }) => {
  const data = await graphql({
    query: PROJECT_META_QUERY,
    token,
    variables: { number, owner },
  });
  const project = data.user?.projectV2;
  if (!project?.field) {
    throw new Error(`No Status field on ${owner}'s project #${number}.`);
  }
  const options = new Map(project.field.options.map((o) => [o.name, o.id]));
  return { fieldId: project.field.id, options, projectId: project.id };
};

const CLOSING_ISSUES_QUERY = `
  query ($id: ID!) {
    node(id: $id) {
      ... on PullRequest {
        closingIssuesReferences(first: 20) { nodes { id } }
      }
    }
  }`;

/** The node ids of every issue this PR closes, so they move with the PR. */
const closingIssueIds = async ({ prNodeId, token }) => {
  const data = await graphql({
    query: CLOSING_ISSUES_QUERY,
    token,
    variables: { id: prNodeId },
  });
  return (data.node?.closingIssuesReferences?.nodes ?? []).map((n) => n.id);
};

const ADD_ITEM_MUTATION = `
  mutation ($projectId: ID!, $contentId: ID!) {
    addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
      item { id }
    }
  }`;

const SET_STATUS_MUTATION = `
  mutation ($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $projectId, itemId: $itemId, fieldId: $fieldId,
      value: { singleSelectOptionId: $optionId }
    }) { projectV2Item { id } }
  }`;

/** Add the content to the board if needed, then set its Status. */
const applyStatus = async ({ contentId, meta, optionId, token }) => {
  const added = await graphql({
    query: ADD_ITEM_MUTATION,
    token,
    variables: { contentId, projectId: meta.projectId },
  });
  const itemId = added.addProjectV2ItemById?.item?.id;
  if (!itemId) {
    return;
  }
  await graphql({
    query: SET_STATUS_MUTATION,
    token,
    variables: {
      fieldId: meta.fieldId,
      itemId,
      optionId,
      projectId: meta.projectId,
    },
  });
};

/** The content node ids this event should move: the subject + a PR's issues. */
const contentIdsFor = async ({ eventName, payload, token }) => {
  if (eventName === 'issues') {
    return [payload.issue.node_id];
  }
  const prNodeId = payload.pull_request.node_id;
  return [prNodeId, ...(await closingIssueIds({ prNodeId, token }))];
};

const main = async () => {
  const token = process.env.GH_PROJECT_TOKEN;
  if (!token) {
    console.warn('No GH_PROJECT_TOKEN (fork PR?) — skipping project sync.');
    return;
  }
  const eventName = process.env.GITHUB_EVENT_NAME ?? '';
  const payload = JSON.parse(
    readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'),
  );

  const status = targetStatus({ eventName, payload });
  if (status === undefined) {
    console.log(`No status change for ${eventName}/${payload.action}.`);
    return;
  }

  const owner = process.env.PROJECT_OWNER ?? '';
  const number = Number(process.env.PROJECT_NUMBER);
  const meta = await resolveProjectMeta({ number, owner, token });
  const optionId = meta.options.get(status);
  if (!optionId) {
    throw new Error(`Status option "${status}" not found on the project.`);
  }

  const contentIds = await contentIdsFor({ eventName, payload, token });
  for (const contentId of contentIds) {
    await applyStatus({ contentId, meta, optionId, token });
  }
  console.log(`Set ${contentIds.length} item(s) to "${status}".`);
};

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
