import { Button } from '#ui/components/Button';
import { useClearTableGrouping } from '#ui/components/Table/contexts/TableConfig/grouping/actions';

/**
 * The write goes through the grouping action rather than resetting a store directly, so it
 * takes the persist-then-navigate path every other grouping change takes (ADR-061).
 * Anything else would be overwritten by the loader on the next navigation, because the URL
 * — not the store — is where the applied grouping lives.
 */
export const TableEmptyStateClearGroupingButton = () => {
  const clearGrouping = useClearTableGrouping();

  return (
    <Button onClick={clearGrouping} variant='primary'>
      Clear grouping
    </Button>
  );
};
