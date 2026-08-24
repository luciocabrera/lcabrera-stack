type ToggleCommandStateArgs<TValue extends string> = {
  readonly current: TValue | undefined;
  readonly isDisabled: boolean;
  readonly target: NoInfer<TValue> | undefined;
};

/** Active/enabled state for a toggle-to-a-value command against a column (ADR-011). */
export const deriveToggleCommandState = <TValue extends string>({
  current,
  isDisabled,
  target,
}: ToggleCommandStateArgs<TValue>) => ({
  isActive: target !== undefined && current === target,
  isEnabled: !isDisabled && (target !== undefined || current !== undefined),
});
