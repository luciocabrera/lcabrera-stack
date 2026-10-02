## 5. Scope Definition

### In Scope

- A `clampNumber` util in `packages/utils/src/numbers/`, with its unit tests
- An ADR for how it treats inverted bounds

### Out of Scope

- Exporting it from the package barrel
- Non-finite inputs (`NaN`, `Infinity`)
- Any caller

## 6. Acceptance Criteria

- [ ] For finite `value`, `min` and `max`, `clampNumber({ value, min, max })` returns `min` when `value < min`, `max` when `value > max`, and `value` otherwise
- [ ] Unit tests cover all three of those branches, and the inverted-bounds case
- [ ] Oxlint reports nothing in the changed files, and nothing in them is suppressed (AGENTS.md Rule 11)
- [ ] The code follows `.claude/rules/typescript.md`: `type`, never `interface`, and every property `readonly`
- [ ] The decision to throw a `RangeError` when `min > max`, rather than swap the bounds, is recorded in an ADR under `docs/decisions/`
