/*
 * The created-tree gate's sorted and filtered page checks, run over HTTP
 * against a server that answers the way a route that ignores the parameter
 * does, and the way one that honours it does. A check that passed both would
 * pass a tree whose table never reaches the database.
 */

import { createServer } from 'node:http';
import { afterAll, beforeAll, describe, expect, test } from 'vite-plus/test';

import {
  externalDatabase,
  orderedRowFindings,
  scrubbedEnv,
} from './devkit-tree-run-database.mjs';

const ids = (from, to) =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index);

const ANSWERS = {
  baseline: ids(1, 10),
  filtered: [3, 7, 9, 15, 22, 30, 31, 32, 50, 51, 60],
  sorted: [379, 759, 359, 12, 40, 41, 42, 43, 44, 45],
};

const page = (rows) =>
  rows
    .map(
      (id) =>
        `<tr role="row"><td role="gridcell"><span title="${id}">${id}</span></td></tr>`,
    )
    .join('');

const served = { rowsFor: () => [] };

const server = createServer((request, response) => {
  const search = new URL(request.url ?? '/', 'http://local').searchParams;
  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(page(served.rowsFor(search)));
});

beforeAll(
  () =>
    new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    }),
);

afterAll(() => new Promise((resolve) => server.close(() => resolve())));

const serving = (rowsFor) => {
  served.rowsFor = rowsFor;
  return `http://127.0.0.1:${server.address().port}/`;
};

const honouring = (search) => {
  if (search.has('sorting')) return ANSWERS.sorted;
  if (search.has('filters')) return ANSWERS.filtered.slice(0, 10);
  return ANSWERS.baseline;
};

describe('orderedRowFindings', () => {
  test('passes a route that sorts and filters', async () => {
    const baseUrl = serving(honouring);

    expect(await orderedRowFindings({ answers: ANSWERS, baseUrl })).toEqual([]);
  });

  test('fails a route whose loader ignores the sort (the plant)', async () => {
    const baseUrl = serving((search) =>
      honouring(
        new URLSearchParams([...search].filter(([key]) => key !== 'sorting')),
      ),
    );

    const findings = await orderedRowFindings({ answers: ANSWERS, baseUrl });

    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('did not sort by `total_amount` descending');
  });

  test('fails a route whose loader ignores the filter', async () => {
    const baseUrl = serving((search) =>
      honouring(
        new URLSearchParams([...search].filter(([key]) => key !== 'filters')),
      ),
    );

    const findings = await orderedRowFindings({ answers: ANSWERS, baseUrl });

    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain(
      "did not filter to `order_status = 'Delivered'`",
    );
  });
});

describe('the database the lane uses', () => {
  test('is the named one when DEVKIT_TREE_DB_HOST is set', () => {
    expect(
      externalDatabase({
        DEVKIT_TREE_DB_HOST: 'localhost',
        DEVKIT_TREE_DB_PASSWORD: 'p',
        DEVKIT_TREE_DB_PORT: '5432',
        DEVKIT_TREE_DB_USER: 'u',
      }),
    ).toEqual({
      DB_HOST: 'localhost',
      DB_PASSWORD: 'p',
      DB_PORT: '5432',
      DB_USER: 'u',
    });
  });

  test('is the tree’s own when it is not', () => {
    expect(externalDatabase({ DB_HOST: 'elsewhere' })).toBeUndefined();
  });

  test('never reaches the tree through an inherited DB_ variable', () => {
    expect(
      scrubbedEnv({ COMPOSE_PROJECT_NAME: 'x', DB_HOST: 'h', PATH: '/bin' }),
    ).toEqual({ PATH: '/bin' });
  });
});
