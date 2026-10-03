# Skill quality baseline

```bash
vp run evals:skills:quality                  # every skill
vp run evals:skills:quality -- unslop epic   # some skills
```

Each skill's `SKILL.md` goes to a Claude session with no tools, using the prompt
and the five-dimension rubric that `waza quality` uses (Waza v0.38.7,
`internal/quality`). The judge scores clarity, completeness, trigger precision,
scope coverage and anti-patterns from 1 to 5. The script prints a markdown
table and saves each raw reply to `.tmp/skill-quality/`.

It exists because `waza quality` judges only through the Copilot SDK, and this
repository runs its model calls on a Claude login.

**It is a baseline, not a gate.** No score fails it. It exits 1 only when a
session fails, a reply is not the JSON the prompt asks for, a score is missing
or outside 1 to 5, or a name is not a skill. The `overall` column is the mean of
the five scores, computed here rather than taken from the judge.

Read the scores with three caveats:

- They are one model's opinion on one run. Repeat runs can move a skill's
  `overall` by a few tenths, so compare a skill with itself across a change,
  not with its neighbour in the table.
- `trigger_precision` asks for "USE FOR" and "DO NOT USE FOR" lists, which this
  repository's skills do not write. The skill trigger evals in
  [`../skills/`](../skills/README.md) measure triggering directly.
- The judge sees only `SKILL.md`, not the files it links to.

Nothing in CI runs it.
