type RunWithConcurrencyLimitArgs<T> = {
  readonly items: readonly T[];
  readonly limit: number;
  readonly worker: (item: T) => Promise<void>;
};

/**
 * Runs `worker` over every item with at most `limit` invocations in flight at
 * once — the global concurrency cap of PRD_V2 §9 / ADR-033. Items beyond the
 * limit wait for a running one to finish rather than all starting together, so
 * the platform host is never asked to execute more than `limit` scans
 * simultaneously (host protection, distinct from §8's per-project admission
 * control). `limit` is clamped to at least 1 — a non-positive cap would
 * otherwise spawn no workers and silently stall the drain — and never spawns
 * more workers than there are items. Resolves once every item is processed.
 *
 * A single shared iterator is the hand-off: `iterator.next()` is synchronous,
 * so two concurrent workers can never be handed the same item, and each worker
 * pulls its next item only after its previous one settles. Errors propagate
 * (via `Promise.all`) exactly as the old sequential `for` loop let them — the
 * caller's `worker` is responsible for not throwing on a single bad item.
 */
export const runWithConcurrencyLimit = async <T>({
  items,
  limit,
  worker,
}: RunWithConcurrencyLimitArgs<T>): Promise<void> => {
  const iterator = items[Symbol.iterator]();

  const runWorker = async (): Promise<void> => {
    let next = iterator.next();
    while (next.done !== true) {
      await worker(next.value);
      next = iterator.next();
    }
  };

  const workerCount = Math.min(Math.max(limit, 1), items.length);

  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
};
