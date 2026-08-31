/**
 * Derives the merge ORDER for the open queue — §3 of .claude/pr-queue-policy.md.
 *
 * Why this exists: the queue is a DAG, not a list. Merging a stacked PR before
 * its base rewrites the base's diff under it; merging a register sweep before
 * the PR it is meant to summarise leaves it silently wrong rather than
 * conflicting. Neither failure shows up as a red check, so nothing but this
 * ordering catches them.
 *
 * Every edge carries the rule id that produced it, so a decision log can say why
 * a PR sits where it does instead of asserting an order the reader must trust.
 *
 * Governed by .claude/rules/scripts.md.
 */

const DECLARED_EDGE = /\b(?:depends on|stacked on|blocked by|after)\s+#(\d+)/gi;

const SNAPSHOT_PATH =
  /^(?:docs\/coordination\/tasks\/|reports\/[^/]+\/baselines\/|CHANGELOG\.md$)/;

export const stackEdges = (queue) => {
  const byHead = new Map(queue.map((pr) => [pr.headRefName, pr.number]));
  return queue.flatMap((pr) => {
    const base = byHead.get(pr.baseRefName);
    return base === undefined || base === pr.number
      ? []
      : [{ from: base, rule: 'O1', to: pr.number }];
  });
};

export const declaredEdges = (queue) => {
  const open = new Set(queue.map((pr) => pr.number));
  return queue.flatMap((pr) =>
    [...pr.body.matchAll(DECLARED_EDGE)]
      .map((match) => Number(match[1]))
      .filter((number) => open.has(number) && number !== pr.number)
      .map((number) => ({ from: number, rule: 'O2', to: pr.number })),
  );
};

const sharedPaths = (left, right) => {
  const rightPaths = new Set(right.files.map((file) => file.path));
  return left.files
    .map((file) => file.path)
    .filter((path) => rightPaths.has(path));
};

const sharedDirectories = (left, right) => {
  const directoryOf = (path) => path.slice(0, path.lastIndexOf('/') + 1);
  const rightDirectories = new Set(
    right.files.map((file) => directoryOf(file.path)),
  );
  return left.files
    .map((file) => directoryOf(file.path))
    .filter((directory) => directory !== '' && rightDirectories.has(directory));
};

const pairs = (queue) =>
  queue.flatMap((left, index) =>
    queue.slice(index + 1).map((right) => [left, right]),
  );

export const overlapEdges = (queue) =>
  pairs(queue)
    .filter(([left, right]) => sharedPaths(left, right).length > 0)
    .map(([left, right]) => {
      const leftFirst =
        left.size === right.size
          ? left.number < right.number
          : left.size < right.size;
      return leftFirst
        ? { from: left.number, rule: 'O3', to: right.number }
        : { from: right.number, rule: 'O3', to: left.number };
    });

export const isSnapshot = (pr) =>
  pr.files.length > 0 &&
  pr.files.every(
    (file) => SNAPSHOT_PATH.test(file.path) && file.additions === 0,
  );

export const snapshotEdges = (queue) =>
  pairs(queue)
    .filter(([left, right]) => isSnapshot(left) !== isSnapshot(right))
    .filter(([left, right]) => sharedDirectories(left, right).length > 0)
    .map(([left, right]) =>
      isSnapshot(left)
        ? { from: right.number, rule: 'O4', to: left.number }
        : { from: left.number, rule: 'O4', to: right.number },
    );

export const topoSort = (numbers, edges) => {
  const indegree = new Map(numbers.map((number) => [number, 0]));
  const successors = new Map(numbers.map((number) => [number, []]));
  for (const { from, to } of edges) {
    if (!indegree.has(from) || !indegree.has(to) || from === to) {
      continue;
    }
    successors.get(from).push(to);
    indegree.set(to, indegree.get(to) + 1);
  }

  const ready = numbers
    .filter((number) => indegree.get(number) === 0)
    .sort((a, b) => a - b);
  const order = [];
  while (ready.length > 0) {
    const number = ready.shift();
    order.push(number);
    for (const next of successors.get(number)) {
      indegree.set(next, indegree.get(next) - 1);
      if (indegree.get(next) === 0) {
        ready.push(next);
      }
    }
    ready.sort((a, b) => a - b);
  }

  const placed = new Set(order);
  return { cycle: numbers.filter((number) => !placed.has(number)), order };
};

export const deriveOrder = (queue) => {
  const edges = [
    ...stackEdges(queue),
    ...declaredEdges(queue),
    ...overlapEdges(queue),
    ...snapshotEdges(queue),
  ];
  const numbers = queue.map((pr) => pr.number);
  const { cycle, order } = topoSort(numbers, edges);
  return { cycle, edges, order };
};

export const edgesFor = (edges, number) =>
  edges.filter((edge) => edge.to === number || edge.from === number);

export const descendants = (edges, roots) => {
  const reached = new Set();
  const pending = [...roots];
  while (pending.length > 0) {
    const number = pending.shift();
    for (const edge of edges.filter((candidate) => candidate.from === number)) {
      if (!reached.has(edge.to)) {
        reached.add(edge.to);
        pending.push(edge.to);
      }
    }
  }
  return reached;
};
