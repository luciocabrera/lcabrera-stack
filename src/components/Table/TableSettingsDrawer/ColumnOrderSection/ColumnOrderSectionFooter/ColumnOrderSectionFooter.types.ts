export type ColumnOrderSectionFooterProps = {
  /** Callback when "Order by Sorting" is clicked. If not provided, applies the order directly. */
  onOrderBySorting?: () => void;
  /** Display variant: 'footer' for full-width buttons, 'toolbar' for mini icon-only buttons */
  variant?: 'footer' | 'toolbar';
};
