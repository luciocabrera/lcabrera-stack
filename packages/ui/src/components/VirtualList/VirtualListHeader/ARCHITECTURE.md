# VirtualListHeader Architecture

Self-connected search header: owns its store wiring instead of receiving drilled props (zero props, no `.types.ts`).

## Responsibilities

- Read the current term via `useGetSearchTerm` and the input `name` via `useGetSearchInputName`
- Write through actions: `useSetSearchTerm` (adapts the input `ChangeEvent` to a string) and `useClearSearch`
- Render the clear button only while the term is non-empty
- Forward all browser password-manager ignore attributes used by the previous inline implementation

## Store Wiring

| Kind      | Hooks                                                     |
| --------- | --------------------------------------------------------- |
| Selectors | `useGetSearchTerm` (ui), `useGetSearchInputName` (config) |
| Actions   | `useSetSearchTerm`, `useClearSearch` (ui)                 |

Must render inside the VirtualList providers (see `../contexts/ARCHITECTURE.md`).
