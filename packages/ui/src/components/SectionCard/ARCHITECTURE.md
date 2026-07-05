# SectionCard Architecture

Generic bordered "section box": a `Card` with a title, optional
description, and arbitrary children. Extracted from
`Settings/SettingsOptionSection`, which had this exact same shape but
hardcoded a `RadioOptionGroup` as its only possible content — any other
consumer needing "title + description + a bordered card" (a Form inside a
page section, for example) could not reuse it without that extraction.

## Public API

- `SectionCard` — `title: string`, `description?: string`, `children:
ReactNode`, `customStylex?: StyleXStyles` (forwarded straight to `Card`,
  for a caller that needs a specific width/height — `Card` gained this
  prop as part of this same change).

## Composition

`Card` (`color='default' elevation='sm' padding='lg'`, all fixed —
`customStylex` is the escape hatch for anything beyond that) wraps a
`<section>` with a `<h2>` title, an optional `<p>` description, then
whatever `children` the caller renders below.

## File Structure

- `SectionCard.component.tsx` — the render
- `SectionCard.stylex.ts` — section/title/description styles (moved here from `Settings.stylex.ts`, which no longer needs them)
- `SectionCard.types.ts` — `SectionCardProps`
- `SectionCard.test.tsx` — title/description/children rendering
- `index.ts` — barrel: component + type

## Consumers

`Settings/SettingsOptionSection` (refactored to compose this instead of
duplicating it) and CQMS's `new-project`/`edit-project`/`trigger-scan`
Forms (Implementation Plan step 8 correction).
