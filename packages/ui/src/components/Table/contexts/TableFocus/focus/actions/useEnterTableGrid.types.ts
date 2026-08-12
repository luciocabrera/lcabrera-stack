export type EnterTableGridArgs = {
  /**
   * Whether focus landed on the grid container itself rather than on one of its
   * descendants — the difference between tabbing into the grid and clicking a
   * cell that is already inside it.
   */
  readonly isGridElement: boolean;
};
