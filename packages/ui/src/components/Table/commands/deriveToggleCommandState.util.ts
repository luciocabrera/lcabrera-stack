type ToggleCommandStateArgs<TValue extends string> = {
  readonly current: TValue | undefined;
  /** Whether the capability is unavailable for this column (e.g. static column). */
  readonly isDisabled: boolean;
  /** The value the command applies; `undefined` is the "clear" command. */
  readonly target: NoInfer<TValue> | undefined;
};

/**
 * Active/enabled state for a toggle-to-a-value command against a column
 * (ADR-011). `isActive` when the column's current value equals the command's
 * target; `isEnabled` unless the capability is disabled for the column and —
 * for the clear command (`target: undefined`) — unless there is nothing to
 * clear. Capability-agnostic: pinning passes sides (`'left' | 'right'`), sorting
 * passes directions (`'asc' | 'desc'`). Pure — each surface feeds `current`
 * from its own selector (live for the header, draft for the drawer), so the
 * derivation lives once while the state source stays correct per context.
 */
export const deriveToggleCommandState = <TValue extends string>({
  current,
  isDisabled,
  target,
}: ToggleCommandStateArgs<TValue>) => ({
  isActive: target !== undefined && current === target,
  isEnabled: !isDisabled && (target !== undefined || current !== undefined),
});
