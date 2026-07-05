# MarkdownRenderer Architecture

Renders LLM-authored Markdown (CQMS scan reports' `report.md`) as styled
HTML. New dependency: `react-markdown`.

## Public API

- `MarkdownRenderer` — `content: string` (raw Markdown source).

## Safety

`react-markdown` does not interpret raw HTML embedded in the Markdown
source unless the `rehype-raw` plugin is explicitly added — this component
deliberately omits it, so content stays inert even though the source is
LLM-generated, not directly user-submitted. No separate sanitizer
(`rehype-sanitize`) is needed on top of that default; adding one only
matters once `rehype-raw` is in the pipeline, which it isn't here.

## Styling

StyleX has no descendant-selector mechanism to cascade styles into another
library's rendered output, so this component maps each Markdown element to
its own styled wrapper via `react-markdown`'s `components` prop
(`h1`/`h2`/`h3`/`p`/`ul`/`ol`/`a`/`blockquote`/`code`/`pre`) rather than
wrapping the whole output in one "prose" class. `pre` carries no background
of its own — `react-markdown` always nests a `<code>` (styled by
`styles.code`, a background pill) inside `<pre>` for fenced blocks, so
giving `pre` a background too would double it up.

## File Structure

- `MarkdownRenderer.component.tsx` — the `components` map + `<Markdown>` render
- `MarkdownRenderer.stylex.ts` — per-element styles
- `MarkdownRenderer.types.ts` — `MarkdownRendererProps`
- `MarkdownRenderer.test.tsx` — headings/paragraphs/lists, fenced code, raw-HTML inertness
- `index.ts` — barrel: component + type

## Consumer

CQMS's `scan-detail` route (Implementation Plan step 8) renders each scan's
`reports.report_markdown` through this component.
