/**
 * A thenable that is not a native `Promise`, the shape a validator from a
 * library with its own promise type returns. Built through a `Proxy` because
 * the object has to answer `then` on purpose.
 */
export const createForeignThenable = (then: unknown) =>
  new Proxy(
    {},
    {
      get: (...[, key]: readonly [object, PropertyKey]) =>
        key === 'then' ? then : undefined,
    },
  );
