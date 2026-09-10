export type GroupingSectionToolbarProps = {
  readonly isBusy?: boolean;
  /** Which part of the grouping the pair acts on; defaults to the whole of it. */
  readonly scope?: 'aggregates' | 'grouping' | 'keys';
  readonly variant?: 'footer' | 'toolbar';
};
