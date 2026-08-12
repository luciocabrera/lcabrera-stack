export type MoveTableGridFocusArgs = {
  /** `Ctrl`/`Meta` held — what turns `Home`/`End` into grid-wide moves. */
  readonly isRangeModifier: boolean;
  readonly key: string;
};
