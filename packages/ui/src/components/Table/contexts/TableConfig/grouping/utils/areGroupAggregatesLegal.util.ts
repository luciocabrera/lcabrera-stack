import type { TableColumnAggregate } from '#ui/components/Table/Table.types';

import { toTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';

/**
 * Whether an aggregate list is a legal **shape** for a grouping: no
 * `(columnKey, fn)` pair repeated.
 *
 * `areGroupKeysLegal` beside this one is the model, and the reason is the same:
 * the store is the boundary a published package exposes to a consumer writing
 * their own loader, and a shape the table cannot render must be refused there
 * rather than seeded. There is no depth cap to check — a column may carry as
 * many measures as the catalogue offers (#831) — so distinctness is the whole
 * question.
 *
 * **This guard is new because the shape change removed the one that was
 * implicit.** While `aggregates` was a column-to-function map a repeated pair
 * was unrepresentable, so nothing had to check for one; a list admits it. Left
 * unchecked, a consumer-seeded duplicate gives `toAggregateItems` two rows
 * sharing an id — React reconciles them as one — and reaches the server as two
 * projections deriving the same alias, which `assertGroupAliases` refuses: a 500
 * out of a state `@lcabrera/ui` itself accepted.
 *
 * A predicate rather than a refusal, like `areGroupKeysLegal`, so a caller
 * decides what "illegal" means for it. It is deliberately the **shape** question
 * only: whether a column exists, and whether the catalogue permits the function
 * on it (ADR-058), are questions the store cannot answer and stay with
 * `sanitizeGroupingByColumns` and the server. `sanitizeGroupingByColumns` asks
 * this same distinctness question at the URL boundary and refuses whole there
 * too.
 *
 * Comparing whole tokens is sound where **joining** them would not be (see
 * `getShareDenominators`): the token is injective over `(columnKey, fn)` because
 * the function vocabulary is closed and contains no `:`, and a `Set` compares
 * one entry at a time.
 */
export const areGroupAggregatesLegal = (
  aggregates: readonly TableColumnAggregate[],
) =>
  new Set(aggregates.map((entry) => toTableAggregateToken(entry))).size ===
  aggregates.length;
