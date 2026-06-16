# Comparison Utilities Architecture

Generic object-comparison helpers used by the store layer.

## Files

| File                     | Description                                                                |
| ------------------------ | -------------------------------------------------------------------------- |
| `areEqualByJson.util.ts` | `{ left, right }` → `boolean`; deep structural equality via JSON.stringify |
| `shallowEqual.util.ts`   | `{ objA, objB }` → `boolean`; compares one level of keys and values        |

## Behaviour

`shallowEqual` performs a **one-level** equality check:

- Compares key count first (fast path).
- Compares each value with strict `===`.
- Does **not** recurse into nested objects — nested objects are equal only when they are the same reference.

## Consumers

- `src/hooks/useStore.hook.ts` — imported via `@/utils` barrel to power store granular-subscription diffing.
