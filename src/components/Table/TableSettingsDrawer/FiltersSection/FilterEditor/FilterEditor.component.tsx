import * as stylex from '@stylexjs/stylex';

import { FilterInputs } from '@/components/Table/TableHeaderCell/filters/FilterInputs';

import type { FilterEditorProps } from './FilterEditor.types';

import { styles } from './FilterEditor.stylex';

export const FilterEditor = <TData,>({
  columnKey,
  filter,
  onChange,
}: FilterEditorProps<TData>) => {
  return (
    <div {...stylex.props(styles.container)} data-testid='filter-editor'>
      <FilterInputs<TData>
        columnKey={columnKey}
        filter={filter ?? undefined}
        onChange={onChange}
      />
    </div>
  );
};

FilterEditor.displayName = 'FilterEditor';
