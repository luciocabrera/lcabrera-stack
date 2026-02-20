/**
 * Subscription Analysis for useTableContent
 *
 * Current subscriptions in useTableContent that trigger TableContent re-render:
 *
 * | State             | Used By              | Needed in TableContent? | Can Push Down? |
 * |-------------------|----------------------|-------------------------|----------------|
 * | columnFilters     | TableSettingsDrawer  | Only when open          | ✅ Yes         |
 * | columnSizing      | Persistence effect   | No, effect-only         | ✅ Yes         |
 * | columnOrder       | TableSettingsDrawer  | Only when open          | ✅ Yes         |
 * | columnVisibility  | TableSettingsDrawer  | Only when open          | ✅ Yes         |
 * | sorting           | TableSettingsDrawer  | Only when open          | ✅ Yes         |
 * | storeData         | dataToRender calc    | ✅ Yes                  | ❌ No          |
 * | isLoadingMore     | TableHeader/Body     | ✅ Yes                  | ❌ No          |
 *
 * PROBLEM:
 * - TableSettingsDrawer is only visible when isSettingsOpen=true
 * - But we subscribe to ALL its required states ALL the time
 * - Any filter/sort/column change triggers TableContent re-render → cascade
 *
 * SOLUTION OPTIONS:
 *
 * Option A: Lazy subscription via TableSettingsDrawer
 * ─────────────────────────────────────────────────────
 * Move state subscriptions INTO TableSettingsDrawer component.
 * TableContent only passes: isOpen, isPinned, columns, onClose, onPinChange
 *
 * Pros:
 * - No subscription when drawer is closed
 * - Clean separation of concerns
 *
 * Cons:
 * - Need to refactor TableSettingsDrawer to use context hooks
 *
 *
 * Option B: Conditional subscription hook
 * ─────────────────────────────────────────
 * Create useTableSettingsState that only subscribes when enabled
 *
 * const settings = useTableSettingsState({ enabled: isSettingsOpen });
 *
 * Pros:
 * - Minimal changes to existing code
 *
 * Cons:
 * - Conditional hooks are complex, need stable references
 *
 *
 * Option C: Remove persistence effects from useTableContent
 * ─────────────────────────────────────────────────────────
 * Move persistence to a separate hook/component that handles its own subscriptions
 *
 * Pros:
 * - Persistence doesn't need to trigger UI re-renders
 *
 * Cons:
 * - More refactoring
 *
 *
 * RECOMMENDED: Option A
 * ─────────────────────
 * 1. TableSettingsDrawer uses its own context hooks for state
 * 2. useTableContent only subscribes to: storeData, isLoadingMore
 * 3. Persistence effects moved to separate useTablePersistenceEffects hook
 *    that subscribes via useSyncExternalStore (no re-render, just effects)
 *
 *
 * VERIFICATION TEST:
 * ─────────────────
 * To verify our assumption, temporarily remove subscriptions and check render counts:
 *
 * 1. Capture baseline: __renderStats.reset() → navigate → __renderStats.toJSON()
 * 2. Apply minimal subscription change
 * 3. Capture after: __renderStats.reset() → same action → __renderStats.toJSON()
 * 4. Compare render counts
 */
