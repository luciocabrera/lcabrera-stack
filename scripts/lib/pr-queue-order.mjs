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

/** Body lines that declare a dependency the author knows about (policy O2). */
const DECLARED_EDGE = /\b(?:depends on|stacked on|blocked by|after)\s+#(\d+)/gi;

/**
 * Paths whose content is an assertion about what has already landed (policy O4).
 * These are ordered last within their neighbourhood, because landing one early
 * does not conflict — it makes it wrong.
 */
const SNAPSHOT_PATH =
  /^(?:docs\/coordination\/tasks\/|reports\/[^/]+\/baselines\/|CHANGELOG\.md$)/;

/** O1 — B's base branch is A's head branch, so A merges first. */
export const stackEdges = (queue) => {
  const byHead = new Map(queue.map((pr) => [pr.headRefName, pr.number]));
  return queue.flatMap((pr) => {
    const base = byHead.get(pr.baseRefName);
    return base === undefined || base === pr.number
      ? []
      : [{ from: base, rule: 'O1', to: pr.number }];
  });
};

/** O2 — the author said so in the body. Outranks anything inferred below. */
export const declaredEdges = (queue) => {
  const open = new Set(queue.map((pr) => pr.number));
  return queue.flatMap((pr) =>
    [...pr.body.matchAll(DECLARED_EDGE)]
      .map((match) => Number(match[1]))
      .filter((number) => open.has(number) && number !== pr.number)
      .map((number) => ({ from: number, rule: 'O2', to: pr.number })),
  );
};

/** Paths two PRs both touch. */
const sharedPaths = (left, right) => {
  const rightPaths = new Set(right.files.map((file) => file.path));
  return left.files
    .map((file) => file.path)
    .filter((path) => rightPaths.has(path));
};

/** Directories two PRs both touch — the coarser overlap policy O4 uses. */
const sharedDirectories = (left, right) => {
  const directoryOf = (path) => path.slice(0, path.lastIndexOf('/') + 1);
  const rightDirectories = new Set(
    right.files.map((file) => directoryOf(file.path)),
  );
  return left.files
    .map((file) => directoryOf(file.path))
    .filter((directory) => directory !== '' && rightDirectories.has(directory));
};

/** Every unordered pair of the queue, each taken once. */
const pairs = (queue) =>
  queue.flatMap((left, index) =>
    queue.slice(index + 1).map((right) => [left, right]),
  );

/**
 * O3 — two PRs touching the same path merge smaller-diff-first, so the larger
 * one absorbs the rebase. Ties break on PR number so the order is total.
 */
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

/** True when every changed path is a snapshot path and the PR only removes. */
export const isSnapshot = (pr) =>
  pr.files.length > 0 &&
  pr.files.every(
    (file) => SNAPSHOT_PATH.test(file.path) && file.additions === 0,
  );

/** O4 — a snapshot PR merges after anything else touching the same directory. */
export const snapshotEdges = (queue) =>
  pairs(queue)
    .filter(([left, right]) => isSnapshot(left) !== isSnapshot(right))
    .filter(([left, right]) => sharedDirectories(left, right).length > 0)
    .map(([left, right]) =>
      isSnapshot(left)
        ? { from: right.number, rule: 'O4', to: left.number }
        : { from: left.number, rule: 'O4', to: right.number },
    );

/**
 * Kahn's algorithm with an ascending-PR-number tiebreak (policy O5).
 *
 * The tiebreak is what makes a pass auditable: two runs over the same queue must
 * produce the same order, so "ready" is drained in a fixed sequence rather than
 * insertion order. Anything left when no node has indegree zero is in a cycle.
 */
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

/** The full §3 derivation: every edge, the sorted order, and any cycle. */
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

/** The edges that put one PR where it is — what the decision log cites. */
export const edgesFor = (edges, number) =>
  edges.filter((edge) => edge.to === number || edge.from === number);

/**
 * Everything that merges strictly after any of `roots`.
 *
 * Policy §1: escalating a PR escalates whatever is downstream of it, because
 * merging a dependent without its base is how a queue corrupts itself. The roots
 * themselves are excluded — they already have their own verdict.
 */
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
