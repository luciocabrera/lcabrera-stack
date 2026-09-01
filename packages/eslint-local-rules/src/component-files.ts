// The one definition of "which files are component files", shared by every
// rule that keys off it.
//
// This constant exists because the two rules that need it had already drifted:
// `filename-convention` enforces the hyphenated `.error-boundary` spelling (and
// rejects the old camelCase `.errorBoundary`), while
// `no-type-definitions-in-components` still matched `.errorBoundary.tsx` — a
// spelling no file in the repo has used since the rename. The rule was dead on
// every error boundary, and because a dead rule reports zero findings, the lint
// pass looked exactly as green as compliance would.
//
// Suffixes live here so that side of the convention can only ever be changed in
// one place.
//
// The component suffixes are the view, its layout wrapper and its error
// boundary. All three render JSX for a route slot, so all three are
// PascalCase-named after the component and none may declare types.

export const COMPONENT_FILE_SUFFIXES = [
  'component',
  'error-boundary',
  'layout',
] as const;

export const isComponentFilename = (filename: string) =>
  COMPONENT_FILE_SUFFIXES.some((suffix) => filename.endsWith(`.${suffix}.tsx`));
