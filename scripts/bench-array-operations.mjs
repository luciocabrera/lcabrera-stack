/**
 * bench-array-operations.mjs — the measurement behind ADR-054.
 *
 * ADR-054 sanctions an array-operation hierarchy on the strength of two claims:
 * that the `flatMap(x => cond ? [y] : [])` idiom is SLOWER than the
 * `.filter().map()` chain it is marketed as optimizing, and that `.reduce()`+push
 * ties `for...of`+push (which is why banning `for...of` never bought throughput).
 * Both are the kind of claim that rots into folklore if only the conclusion is
 * written down, so the probe lives here and the ADR points at it instead of
 * quoting numbers. Re-run it rather than trusting a remembered figure.
 *
 * Three design choices are what make it evidence rather than a vibe, per
 * AGENTS.md Rule 14 — a probe that could have disproved the claim:
 *   - Results are CONSUMED (lengths summed). Without this the JIT eliminates the
 *     whole allocation, every shape converges, and the benchmark "proves" that
 *     the difference does not exist.
 *   - TWO selectivities. The repo's real case keeps 1-2 of 150; a conclusion
 *     that only holds at a 50% keep rate would not transfer to it.
 *   - MEDIAN of several runs after warmup. A mean lets one GC pause invent a
 *     ranking, which is exactly how a wrong ordering would get published.
 *
 * Usage: node scripts/bench-array-operations.mjs [--json]
 */

/** The five shapes ADR-054 chooses between. Each returns the same array. */
const SHAPES = {
  'filter().map()': (rows, keep) => rows.filter(keep).map((row) => row.name),
  'flatMap()': (rows, keep) =>
    rows.flatMap((row) => (keep(row) ? [row.name] : [])),
  'for...of+push': (rows, keep) => {
    const out = [];
    for (const row of rows) if (keep(row)) out.push(row.name);
    return out;
  },
  'map().filter()': (rows, keep) =>
    rows
      .map((row) => (keep(row) ? row.name : undefined))
      .filter((name) => name !== undefined),
  'reduce()+push': (rows, keep) =>
    rows.reduce((acc, row) => {
      if (keep(row)) acc.push(row.name);
      return acc;
    }, []),
};

const SIZES = [100, 1_000, 10_000, 100_000, 1_000_000];

const CASES = [
  { keep: (row) => row.isActive, label: 'keep 50%' },
  { keep: (row) => row.isRare, label: 'keep 2%' },
];

const RUNS = 9;
const WARMUP = 3;
const WORK_UNITS = 20_000_000;

/** @returns {number} median of a numeric list, without mutating it */
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

/** @returns {readonly object[]} deterministic rows — no Math.random, so runs compare */
const buildRows = (size) =>
  Array.from({ length: size }, (_, index) => ({
    isActive: index % 2 === 0,
    isRare: index % 50 === 0,
    name: `name-${index}`,
  }));

/**
 * Times one shape. The `sink` accumulation is load-bearing, not decoration —
 * it is what stops the optimizer deleting the allocation under test.
 * @returns {number} median milliseconds per call
 */
const timeShape = (shape, rows, keep, iterations) => {
  for (let warm = 0; warm < WARMUP; warm += 1) shape(rows, keep);

  const samples = [];
  for (let run = 0; run < RUNS; run += 1) {
    let sink = 0;
    const started = process.hrtime.bigint();
    for (let i = 0; i < iterations; i += 1) sink += shape(rows, keep).length;
    const elapsed = process.hrtime.bigint() - started;
    if (sink < 0)
      throw new Error('unreachable: sink guards dead-code elimination');
    samples.push(Number(elapsed) / 1e6 / iterations);
  }

  return median(samples);
};

/** @returns {object} one `{ size, label, shapes: {name: ms} }` record */
const measureCase = (size, { keep, label }) => {
  const rows = buildRows(size);
  const iterations = Math.max(1, Math.floor(WORK_UNITS / size));
  const shapes = Object.fromEntries(
    Object.entries(SHAPES).map(([name, shape]) => [
      name,
      timeShape(shape, rows, keep, iterations),
    ]),
  );

  return { iterations, label, shapes, size };
};

/** @returns {string} a fixed-width table, fastest first, normalised to the chain */
const formatCase = ({ iterations, label, shapes, size }) => {
  const baseline = shapes['filter().map()'];
  const rows = Object.entries(shapes)
    .sort((a, b) => a[1] - b[1])
    .map(([name, ms]) => {
      const micros = (ms * 1000).toFixed(3).padStart(11);
      return `    ${name.padEnd(16)}${micros} us   ${(ms / baseline).toFixed(2)}x`;
    });

  return [
    `\nN=${size} ${label} (iters=${iterations}, median of ${RUNS})`,
    ...rows,
  ].join('\n');
};

const records = SIZES.flatMap((size) =>
  CASES.map((testCase) => measureCase(size, testCase)),
);

if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify(records, undefined, 2)}\n`);
} else {
  process.stdout.write(`${records.map(formatCase).join('\n')}\n`);
  process.stdout.write(
    '\nRatios are relative to filter().map(). ADR-054 depends on the ORDERING,\n' +
      'not these absolute figures — see docs/decisions/ADR-054-array-operation-hierarchy.md\n',
  );
}
