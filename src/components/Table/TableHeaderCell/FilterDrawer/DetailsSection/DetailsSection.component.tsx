import * as stylex from '@stylexjs/stylex';

import { useGetNormalizedColumn } from '@/components/Table/contexts/TableConfig/columns/selectors';

import type { DetailsSectionProps } from './DetailsSection.types';

import { styles } from './DetailsSection.stylex';

export const DetailsSection = <TData,>({
  columnKey,
}: DetailsSectionProps<TData>) => {
  const column = useGetNormalizedColumn<TData>(columnKey);

  const {
    dataType,
    isFilterable,
    isSortable,
    key,
    label,
    maxWidth,
    minWidth,
    sortDirection,
  } = column;

  const details: { label: string; value: string }[] = [
    { label: 'Label', value: label },
    { label: 'Key', value: key },
    { label: 'Data Type', value: dataType ?? '—' },
    { label: 'Sortable', value: isSortable === false ? 'No' : 'Yes' },
    { label: 'Filterable', value: isFilterable === false ? 'No' : 'Yes' },
    {
      label: 'Sort Direction',
      value: sortDirection ?? 'None',
    },
    { label: 'Min Width', value: minWidth ? `${String(minWidth)}px` : '—' },
    { label: 'Max Width', value: maxWidth ? `${String(maxWidth)}px` : '—' },
  ];

  return (
    <div {...stylex.props(styles.container)}>
      {details.map((detail) => (
        <div key={detail.label} {...stylex.props(styles.item)}>
          <span {...stylex.props(styles.label)}>{detail.label}</span>
          <span {...stylex.props(styles.value)}>{detail.value}</span>
        </div>
      ))}
    </div>
  );
};
