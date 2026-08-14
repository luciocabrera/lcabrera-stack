# TypeScript and React Rule Fix Quick Reference

This guide maps smell rule IDs to practical remediation patterns so downstream agents can move from finding to fix quickly.

React 19 note: with React Compiler enabled, do not require manual memoization as a default remediation strategy.
React Router note: server data fetching should use loaders/actions, not `useEffect` fetch flows.

Use this with:

- [SCHEMA_V1.md](../../../packages/scan-report/SCHEMA_V1.md)
- REPORT_TEMPLATE.md
- EXAMPLE_REPORT.md

## How to use

1. Identify the rule_id in a finding.
2. Apply the matching fix pattern below.
3. Add at least one verification step from the same row.
4. Record the selected approach in the finding's fix field.

## TypeScript rule mapping

| Rule ID                       | Typical smell signal                                   | Preferred fix pattern                                                           | Verification idea                                        |
| ----------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------- | -------------------------------------------------------- |
| TS.ANY-LEAK                   | `any` used in exported API or shared DTO               | Replace `any` with `unknown` + type guard, or explicit generic constraints      | `vp check` passes and call-sites no longer infer `any`   |
| TS.UNSAFE-CAST                | Direct cast from unknown response: `raw as DomainType` | Parse with runtime validator or narrow with user-defined type guard before cast | Invalid fixture input is rejected in tests               |
| TS.NON-NULL-ASSERT            | Frequent `value!` without control-flow proof           | Narrow with guards or early returns; model nullable state explicitly            | No `!` remains in touched path and null test passes      |
| TS.TS-IGNORE                  | `@ts-ignore` suppresses diagnostics                    | Replace with correct typing, or `@ts-expect-error` with rationale and test      | No raw `@ts-ignore` remains                              |
| TS.DOUBLE-ASSERTION           | `x as unknown as T`                                    | Redesign types to avoid coercion; validate then narrow                          | Type tests compile without double assertion              |
| TS.LOOSY-RECORD               | `Record<string, unknown>` for finite keys              | Use key union type and mapped type                                              | Unknown keys fail compile-time checks                    |
| TS.MUTATION-EXPORT            | Mutable exported object used as singleton state        | Encapsulate state behind getter/setter or immutable update helpers              | Concurrent mutation test shows deterministic behavior    |
| TS.ENUM-SWITCH-DEFAULT        | Switch has default over enum/union                     | Use exhaustive switch with `never` check in default                             | Build fails when new enum value is added without handler |
| TS.IMPLICIT-ANY-CALLBACK      | Callback params inferred to any in public util/hook    | Type callback signature explicitly at API boundary                              | Callers get typed intellisense and compile checks        |
| TS.NO-ERROR-DISCRIMINANT      | Error modeled as bare string                           | Model state as discriminated union with status and payload                      | Narrowing in UI has no unsafe property access            |
| TS.PROMISE-WITHOUT-AWAIT      | Promise created and ignored in control flow            | `await` it, or intentionally detach with `void` and error handling              | No unhandled rejection in tests/logs                     |
| TS.MAGIC-STRING-UNION-MISSING | Repeated literals for status/mode keys                 | Extract const union and shared constants                                        | Invalid literals fail at compile time                    |

## React rule mapping

| Rule ID                              | Typical smell signal                         | Preferred fix pattern                                                                     | Verification idea                                                           |
| ------------------------------------ | -------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| REACT.HOOKS-ORDER-RISK               | Hook call under condition/loop               | Move hooks to top-level and branch inside logic                                           | Hook lint passes and render path is stable                                  |
| REACT.MISSING-DEPS                   | Effect/callback omits referenced vars        | Include all referenced dependencies and restructure effect logic to avoid stale closures  | Changing dep re-runs effect in test                                         |
| REACT.EFFECT-FETCH-WITHOUT-CANCEL    | Server data fetch performed in `useEffect`   | Move fetch to route loader/action; for temporary bridge code, add AbortController cleanup | Loader-driven data path works and unmount before resolve does not set state |
| REACT.KEY-INDEX                      | List keyed by array index                    | Use stable key from domain identity (`id`)                                                | Reorder test keeps row-local state aligned                                  |
| REACT.DERIVED-STATE                  | State mirrors props/computed values          | Derive during render instead of storing a duplicated copy in state                        | Derived value updates correctly without sync effect                         |
| REACT.SETSTATE-IN-RENDER             | Setter called during render                  | Move state update to event/effect/transition                                              | No render loop warning; render count stable                                 |
| REACT.CONTEXT-OVERBROAD              | One context drives many unrelated rerenders  | Split context by concern or expose selector hooks                                         | Unrelated consumers stop rerendering in profiler                            |
| REACT.PROPS-MUTATION                 | Component mutates incoming props             | Clone/transform immutably before changes                                                  | Prop object identity from parent remains unchanged                          |
| REACT.INLINE-HANDLER-HOTPATH         | Heavy list creates inline handlers per row   | Use stable handler references and avoid inline JSX handlers in hot paths                  | Reduced rerenders in hot list benchmark                                     |
| REACT.CONTROLLED-UNCONTROLLED-SWITCH | Input toggles between value and defaultValue | Keep component consistently controlled or uncontrolled                                    | No console warning and input state remains consistent                       |
| REACT.EFFECT-STATE-SYNC              | Effect used to copy derivable state          | Compute in render, remove sync effect, and keep state minimal                             | State drift bug reproduction no longer occurs                               |

## Clean Code and GoF quick pointers

| Rule ID                | Preferred fix pattern                                       |
| ---------------------- | ----------------------------------------------------------- |
| CC.G5                  | Extract duplicate logic into one function/module and reuse  |
| CC.G25                 | Replace literal values with named constants                 |
| CC.G30                 | Split multi-purpose function into focused units             |
| CC.N4                  | Rename ambiguous identifiers to domain-specific names       |
| GOF.STRATEGY-MISSING   | Replace repeated branching with strategy map/object         |
| GOF.FACTORY-MISSING    | Introduce factory boundary for concrete construction        |
| GOF.OBSERVER-MISSING   | Use event subscription model with unsubscribe lifecycle     |
| GOF.FACADE-MISSING     | Introduce facade API to hide subsystem internals            |
| DS.NEEDLESS-REPETITION | Consolidate repeated flows and standardize extension points |
| DS.OPACITY             | Improve module boundaries and naming to expose intent       |

## Snippet examples

### TS.UNSAFE-CAST -> validated narrowing

```ts
import { z } from 'zod';

const OrderSchema = z.object({
  id: z.string(),
  total: z.number(),
});

type Order = z.infer<typeof OrderSchema>;

export const parseOrder = (raw: unknown): Order => {
  return OrderSchema.parse(raw);
};
```

### REACT.MISSING-DEPS -> stable dependency-safe effect

```tsx
import { useEffect } from 'react';

export const Orders = ({
  filters,
  track,
}: {
  filters: string;
  track: (value: string) => void;
}) => {
  useEffect(() => {
    track(filters);
  }, [filters, track]);

  return null;
};
```

### REACT.KEY-INDEX -> stable domain key

```tsx
{
  rows.map((row) => <OrderRow key={row.id} row={row} />);
}
```

## Report authoring guidance

When writing the finding fix field, keep it one sentence and include the concrete mechanism:

- Good: Use AbortController cleanup in the effect and abort pending requests on unmount.
- Too vague: Improve effect handling.

When writing verification_steps, include at least one behavioral check and one static/tooling check when possible.
