import { ChoiceModal } from '#ui/components/ChoiceModal';
import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { useGetTableGroupingCapabilities } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import {
  useGetGroupingAggregates,
  useGetGroupingKeys,
} from '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/selectors';

import {
  useAcceptColumnGroupingPrompt,
  useCancelColumnGroupingPrompt,
} from '../ColumnOrderSectionContext/actions';
import { useGetColumnGroupingPrompt } from '../ColumnOrderSectionContext/selectors';
import { resolveColumnGroupingChoices } from '../utils';

export const ColumnGroupingPromptModal = () => {
  const { columnKey, isOpen } = useGetColumnGroupingPrompt();
  const aggregates = useGetGroupingAggregates();
  const capabilities = useGetTableGroupingCapabilities();
  const columns = useGetColumns();
  const groupingKeys = useGetGroupingKeys();
  const acceptColumnGroupingPrompt = useAcceptColumnGroupingPrompt();
  const cancelColumnGroupingPrompt = useCancelColumnGroupingPrompt();

  const column = columns.find(
    (candidate) => String(candidate.key) === columnKey,
  );
  const options = resolveColumnGroupingChoices({
    aggregates,
    capability: capabilities[columnKey],
    column,
    groupingKeys,
  });
  const [firstOption] = options;

  if (!isOpen || firstOption === undefined) return;

  return (
    <ChoiceModal
      defaultValue={firstOption.value}
      description={
        <>
          The grouping decides which columns the grid shows. Add{' '}
          <strong>{column?.label ?? columnKey}</strong> to it as:
        </>
      }
      isOpen={isOpen}
      onAccept={acceptColumnGroupingPrompt}
      onCancel={cancelColumnGroupingPrompt}
      options={options}
      radioName='column-grouping-choice'
      title='Show Column'
    />
  );
};
