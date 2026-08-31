import { Button } from '#ui/components/Button';
import { useClearTableGrouping } from '#ui/components/Table/contexts/TableConfig/grouping/actions';

export const TableEmptyStateClearGroupingButton = () => {
  const clearGrouping = useClearTableGrouping();

  return (
    <Button onClick={clearGrouping} variant='primary'>
      Clear grouping
    </Button>
  );
};
