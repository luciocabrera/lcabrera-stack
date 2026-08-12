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

/**
 * SonarCloud analyses feature branches as pull requests, so the two target
 * kinds use different query parameters and are never interchangeable — a
 * `branch=<feature>` query 404s where `pullRequest=<n>` succeeds.
 */
export const targetParam = (target) =>
  target.type === 'pullRequest'
    ? `pullRequest=${encodeURIComponent(target.value)}`
    : `branch=${encodeURIComponent(target.value)}`;

/**
 * Parses SonarCloud's `ncloc_language_distribution` measure — a
 * `lang=count;lang=count` string — into a plain object of numbers.
 *
 * This is the measure that answers "was this file actually analysed, and by
 * which analyser?", which no issue count can. A project whose every finding
 * was accepted and a project whose files are excluded both report zero
 * issues; only this tells them apart.
 *
 * Malformed or absent input yields an empty object rather than throwing: it
 * is reporting, not a gate, and a missing measure must not take the run down.
 */
export const parseLanguageLines = (value) =>
  Object.fromEntries(
    String(value ?? '')
      .split(';')
      .map((entry) => entry.split('='))
      // `count` must be non-empty before Number(): `Number('')` is 0, so a
      // malformed `ts=` would otherwise read as "analysed, zero lines" —
      // indistinguishable from a language that really was indexed and empty,
      // and the opposite of the "was this analysed at all" question this
      // measure exists to answer.
      .filter(
        ([lang, count]) => lang && count && Number.isFinite(Number(count)),
      )
      .map(([lang, count]) => [lang, Number(count)]),
  );

const authHeader = (token) => {
  // The colon is Basic-auth's empty-password separator: SonarCloud takes the
  // token as the username. Encoded in its own statement rather than nested in
  // the returned template, which is unreadable and Sonar's S4624.
  const encoded = Buffer.from(`${token}:`).toString('base64');

  return `Basic ${encoded}`;
};

// Every call here is a GET, and the report polls SonarCloud while an analysis is
// still settling — the one place a transient 5xx is most likely.
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
    /**
     * Issues reviewed and marked rather than fixed. Counted separately from
     * open issues so a zero can be read correctly: "clean" and "everything
     * was accepted" are otherwise indistinguishable in the report.
     */
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
      `componentKeys=${project}&resolved=false`,
    ),

    /** Lines of code actually indexed, total and per language. */
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
