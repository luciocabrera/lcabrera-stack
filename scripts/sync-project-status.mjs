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
 * the thing that changed. Items not yet on the board are added first, so a
 * brand-new PR still lands correctly.
 *
 * That add is **not** exclusive to this workflow and `addProjectV2ItemById` is
 * **not** idempotent under a race: `add-to-project.yml` fires on the same
 * `pull_request` events and adds the same content, so one of the two is told
 * `Content already exists in this project` and used to exit 1. The card existing
 * is the outcome this step wanted, so that response is recovered from rather
 * than raised — see `addOrFindBoardItem`. This comment previously claimed the
 * mutation was idempotent, which is why the failure went unnoticed.
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

import { fetchWithRetry } from './lib/fetch-retry.mjs';
import { targetStatus } from './lib/project-status.mjs';

const GRAPHQL_URL = 'https://api.github.com/graphql';

const graphql = async ({ query, token, variables }) => {
  const response = await fetchWithRetry(() =>
    fetch(GRAPHQL_URL, {
      body: JSON.stringify({ query, variables }),
      headers: {
        authorization: `bearer ${token}`,
        'content-type': 'application/json',
      },
      method: 'POST',
    }),
  );
  const body = await response.json();
  if (body.errors) {
    const error = new Error(
      `GraphQL: ${body.errors.map((e) => e.message).join('; ')}`,
    );
    error.graphqlErrors = body.errors;
    throw error;
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

const EXISTING_ITEM_QUERY = `
  query ($contentId: ID!) {
    node(id: $contentId) {
      ... on Issue { projectItems(first: 50) { nodes { id project { id } } } }
      ... on PullRequest { projectItems(first: 50) { nodes { id project { id } } } }
    }
  }`;

const findBoardItemId = async ({ contentId, projectId, token }) => {
  const data = await graphql({
    query: EXISTING_ITEM_QUERY,
    token,
    variables: { contentId },
  });
  const items = data.node?.projectItems?.nodes ?? [];
  return items.find((item) => item.project?.id === projectId)?.id;
};

const addOrFindBoardItem = async ({ contentId, meta, token }) => {
  try {
    const added = await graphql({
      query: ADD_ITEM_MUTATION,
      token,
      variables: { contentId, projectId: meta.projectId },
    });
    return added.addProjectV2ItemById?.item?.id;
  } catch (error) {
    const isAlreadyOnBoard = (error.graphqlErrors ?? []).some((e) =>
      e.message?.includes('already exists in this project'),
    );
    if (!isAlreadyOnBoard) {
      throw error;
    }
    return findBoardItemId({ contentId, projectId: meta.projectId, token });
  }
};

const applyStatus = async ({ contentId, meta, optionId, token }) => {
  const itemId = await addOrFindBoardItem({ contentId, meta, token });
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
