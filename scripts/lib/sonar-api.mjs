/**
 * The SonarCloud Web API client used by `sonar-report.mjs`.
 *
 * Extracted from that script for two reasons. It was at 346 code lines
 * against the 350 ceiling `vp run scripts:verify` enforces, so nothing could
 * be added to it; and the fetch layer is the part worth testing on its own,
 * since every function here is a URL built from a target descriptor.
 *
 * Everything is scoped to one project and one target (a branch or a pull
 * request) — `createSonarApi` binds those once so callers cannot accidentally
 * mix them.
 */

import { fetchWithRetry } from './fetch-retry.mjs';

const PAGE_SIZE = 500;
const MAX_PAGES = 20;

export const targetParam = (target) =>
  target.type === 'pullRequest'
    ? `pullRequest=${encodeURIComponent(target.value)}`
    : `branch=${encodeURIComponent(target.value)}`;

export const parseLanguageLines = (value) =>
  Object.fromEntries(
    String(value ?? '')
      .split(';')
      .map((entry) => entry.split('='))
      .filter(
        ([lang, count]) => lang && count && Number.isFinite(Number(count)),
      )
      .map(([lang, count]) => [lang, Number(count)]),
  );

const authHeader = (token) => {
  const encoded = Buffer.from(`${token}:`).toString('base64');

  return `Basic ${encoded}`;
};

export const fetchJson = async (url, token) => {
  const response = await fetchWithRetry(() =>
    fetch(url, { headers: { Authorization: authHeader(token) } }),
  );
  if (!response.ok) {
    throw new Error(
      `GET ${url} → ${response.status}: ${(await response.text()).slice(0, 200)}`,
    );
  }
  return response.json();
};

const fetchAllPages = async (buildUrl, token, pluck) => {
  const collected = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;
  while (page <= MAX_PAGES && collected.length < total) {
    const body = await fetchJson(buildUrl(page), token);
    const items = pluck(body);
    if (items.length === 0) break;
    collected.push(...items);
    total = body.paging?.total ?? body.total ?? collected.length;
    page += 1;
  }
  return collected;
};

export const createSonarApi = ({ base, project, token }) => {
  const paged = (path, key, extra) => (target) =>
    fetchAllPages(
      (page) =>
        `${base}/api/${path}?${extra}&${targetParam(target)}` +
        `&ps=${PAGE_SIZE}&p=${page}`,
      token,
      (body) => body[key] ?? [],
    );

  return {
    acceptedIssues: paged(
      'issues/search',
      'issues',
      `componentKeys=${project}&resolved=true&resolutions=FALSE-POSITIVE,WONTFIX`,
    ),

    analysisDate: async (target) => {
      const body = await fetchJson(
        `${base}/api/components/show?component=${project}&${targetParam(target)}`,
        token,
      );
      return body.component?.analysisDate;
    },

    gate: async (target) => {
      const body = await fetchJson(
        `${base}/api/qualitygates/project_status?projectKey=${project}` +
          `&${targetParam(target)}`,
        token,
      );
      return body.projectStatus;
    },

    hotspots: paged('hotspots/search', 'hotspots', `projectKey=${project}`),

    issues: paged(
      'issues/search',
      'issues',
      `componentKeys=${project}&resolved=false&additionalFields=_all`,
    ),

    measures: async (target) => {
      const body = await fetchJson(
        `${base}/api/measures/component?component=${project}` +
          `&metricKeys=ncloc,ncloc_language_distribution&${targetParam(target)}`,
        token,
      );
      const measures = body.component?.measures ?? [];
      const value = (key) => measures.find((m) => m.metric === key)?.value;

      return {
        byLanguage: parseLanguageLines(value('ncloc_language_distribution')),
        linesOfCode: Number(value('ncloc') ?? 0),
      };
    },
  };
};
