# Showcase Feature Architecture

Isolated home-page showcase module for exercising UI components without coupling demo logic to domain routes or shared infrastructure.

## Scope

- Lives under `src/features/showcase/`.
- Owns mock/demo datasets and local interaction state for the home showcase page.
- Exposes a single UI entrypoint consumed by `src/App.tsx`.

## Files

| File                                      | Responsibility                                                          |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| `ShowcasePage/ShowcasePage.component.tsx` | Renders the full component showcase experience used by the home route   |
| `ShowcasePage/ShowcasePage.stylex.ts`     | StyleX styles for showcase layout sections and grids                    |
| `ShowcasePage/ShowcasePage.types.ts`      | Showcase-local type contracts for mock rows/responses and section props |
| `ShowcasePage/index.ts`                   | Public barrel for `ShowcasePage`                                        |

## Boundaries

- This module is intentionally app-local and should not be imported by reusable table/core feature modules.
- Shared reusable components stay in `src/components/`; showcase composes them but does not define project-wide primitives.
- `src/App.tsx` acts as a stable wrapper so future migration away from a showcase home page does not require route-level churn.
