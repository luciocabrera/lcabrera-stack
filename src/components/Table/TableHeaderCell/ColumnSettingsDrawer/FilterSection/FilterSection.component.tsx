import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { drawerSectionStyles } from '@/design-system/tokens/drawerSection.stylex';

import type { FilterSectionProps } from './FilterSection.types';

import { FilterInputs } from '../../../filters/FilterInputs';
import { useSetColumnFilters } from '../ColumnDrawerContext/hooks/store/columns/actions';
import { useGetColumnFilters } from '../ColumnDrawerContext/hooks/store/columns/selectors';
import { styles } from './FilterSection.stylex';

export const FilterSection = <TData,>({
  columnKey,
}: FilterSectionProps<TData>) => {
  const columnFilters = useGetColumnFilters();
  const setColumnFilters = useSetColumnFilters();

  const filter = columnFilters
    ? Object.hasOwn(columnFilters, columnKey)
      ? // eslint-disable-next-line security/detect-object-injection -- Safe: guarded by Object.hasOwn
        columnFilters[columnKey]
      : undefined
    : undefined;

  const handleChange = (newFilter: Parameters<typeof FilterInputs>[0]['filter']) => {
    if (newFilter) {
      setColumnFilters({ ...columnFilters, [columnKey]: newFilter });
    } else {
      const { [columnKey as string]: _, ...rest } = columnFilters ?? {};
      setColumnFilters(rest);
    }
  };

  const handleReset = () => {
    const { [columnKey as string]: _, ...rest } = columnFilters ?? {};
    setColumnFilters(rest);
  };

  return (
    <div {...stylex.props(styles.container)}>
      <FilterInputs
        columnKey={columnKey}
        filter={filter}
        onChange={handleChange}
        shouldFillHeight
      />
      <div {...stylex.props(drawerSectionStyles.resetSection)}>
        <Button color='outline' onClick={handleReset} size='sm' width='full'>
          Reset Filter
        </Button>
      </div>
    </div>
  );
};
