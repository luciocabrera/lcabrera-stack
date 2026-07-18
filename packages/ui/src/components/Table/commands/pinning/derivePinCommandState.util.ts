type DerivePinCommandStateArgs = {
  readonly currentSide: PinSide | undefined;
  readonly isStatic: boolean;
  /** The side the command pins to; `undefined` is the "clear pinning" command. */
  readonly targetSide: PinSide | undefined;
};

type PinSide = 'left' | 'right';

/**
 * Active/enabled state for a pinning command against a column, usable by any
 * surface (ADR-011). `isActive` when the column is already pinned to the
 * command's target side; `isEnabled` unless the column is static — and, for the
 * clear command, unless nothing is pinned. Pure: each surface feeds it from its
 * own per-context selector (live for the header, draft for the drawer), so the
 * derivation lives once while the state source stays correct per context.
 */
export const derivePinCommandState = ({
  currentSide,
  isStatic,
  targetSide,
}: DerivePinCommandStateArgs) => ({
  isActive: targetSide !== undefined && currentSide === targetSide,
  isEnabled:
    !isStatic && (targetSide !== undefined || currentSide !== undefined),
});
