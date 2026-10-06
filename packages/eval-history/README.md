# `@repo/eval-history`

The private workspace that records eval runs:
[ADR-130](../../docs/decisions/ADR-130-keep-eval-history-in-a-private-workspace-with-its-own-schema-and-migrator.md)
decides why it exists and why it never ships, and
[ADR-131](../../docs/decisions/ADR-131-version-the-eval-run-envelope-and-accept-the-previous-version.md)
decides how the envelope is versioned.

- `src/envelope/` — the run envelope as a Zod schema, the validator, the
  emitted `envelope.schema.json`, and one example envelope per suite under
  `fixtures/`.
- `src/hashing/` — the input hashes of
  [the plan's §5](../../docs/agents/planning/eval-history-plan.md#5-hashing):
  normalized content hashes, the multi-file hash, canonical JSON, the skill
  catalog hash and the harness version.

The source is TypeScript with erasable syntax only, so a plain `.mjs` runner
imports it through `exports` with no build and no loader.

After changing the schema, run `vp run --filter @repo/eval-history schema:write`
and then `vp fmt .`.
