/**
 * Deciding whether the orders route a `full`-rung tree serves sorts and
 * filters in the database, from the rows its rendered page shows and the rows
 * the same query gives in SQL. Pure: the gate hands in the page and the query
 * results.
 *
 * Each probe also carries the unsorted, unfiltered first rows, because a
 * request whose answer matches them cannot tell a route that sorted from one
 * that ignored the parameter, and a check that passes either way proves
 * nothing.
 */

const ORDERS_TABLE = 'enterprise_orders';

export const COMPARED_ROWS = 10;

const param = (value) => encodeURIComponent(JSON.stringify(value));

const FILTERED_STATUS = 'Delivered';

/**
 * @type {Readonly<Record<string, string>>}
 */
export const ORDERS_QUERIES = {
  baseline: `SELECT order_id FROM ${ORDERS_TABLE} ORDER BY order_id LIMIT ${COMPARED_ROWS}`,
  filtered: `SELECT order_id FROM ${ORDERS_TABLE} WHERE order_status = '${FILTERED_STATUS}' ORDER BY order_id`,
  sorted: `SELECT order_id FROM ${ORDERS_TABLE} ORDER BY total_amount DESC, order_id ASC LIMIT ${COMPARED_ROWS}`,
};

/**
 * @type {ReadonlyArray<{ key: 'filtered' | 'sorted', search: string,
 *                        verb: string }>}
 */
export const ORDERS_PROBES = [
  {
    key: 'sorted',
    search: `?sorting=${param({ total_amount: 'desc' })}`,
    verb: 'sort by `total_amount` descending',
  },
  {
    key: 'filtered',
    search: `?filters=${param({ order_status: ['eq', FILTERED_STATUS] })}`,
    verb: `filter to \`order_status = '${FILTERED_STATUS}'\``,
  },
];

const ROW_START = 'role="row"';

const FIRST_TITLE = /<span title="([^"]+)"/;

const INTEGER = /^\d+$/;

/**
 * @param {string} html
 * @returns {number[]}
 */
export const renderedOrderIds = (html) =>
  html
    .split(ROW_START)
    .slice(1)
    .map((row) => FIRST_TITLE.exec(row.split('</tr>', 1)[0])?.[1] ?? '')
    .filter((cell) => INTEGER.test(cell))
    .map(Number);

const listed = (ids) => ids.join(', ');

const sameStart = ({ expected, shown }) =>
  shown.every((id, index) => id === expected[index]);

/**
 * @param {{ baseline: readonly number[], expected: readonly number[],
 *           key: 'filtered' | 'sorted', rendered: readonly number[],
 *           url: string, verb: string }} args
 * @returns {string[]}
 */
export const orderProbeFindings = ({
  baseline,
  expected,
  key,
  rendered,
  url,
  verb,
}) => {
  const head = expected.slice(0, COMPARED_ROWS);
  if (head.length === 0 || sameStart({ expected: baseline, shown: head })) {
    return [
      `the seeded table gives the same first rows to \`${ORDERS_QUERIES[key]}\` as to \`${ORDERS_QUERIES.baseline}\`, so \`GET ${url}\` cannot show whether the route did ${verb} — the seed no longer separates the two`,
    ];
  }
  const shown = rendered.slice(0, COMPARED_ROWS);
  if (shown.length === 0) {
    return [
      `\`GET ${url}\` rendered no order rows, so nothing shows the route did ${verb}`,
    ];
  }
  if (sameStart({ expected, shown })) return [];
  return [
    `\`GET ${url}\` rendered order_id ${listed(shown)} first, where \`${ORDERS_QUERIES[key]}\` gives ${listed(head)} — the route did not ${verb} in the database`,
  ];
};

/**
 * @param {{ file: string, settings: Readonly<Record<string, string>> }} args
 * @returns {string}
 */
export const withSettings = ({ file, settings }) => {
  const lines = file.replace(/\n+$/, '').split('\n');
  const keyOf = (line) => line.split('=', 1)[0];
  const present = new Set(lines.map((line) => keyOf(line)));
  return [
    ...lines.map((line) =>
      Object.hasOwn(settings, keyOf(line))
        ? `${keyOf(line)}=${settings[keyOf(line)]}`
        : line,
    ),
    ...Object.entries(settings)
      .filter(([key]) => !present.has(key))
      .map(([key, value]) => `${key}=${value}`),
    '',
  ].join('\n');
};
