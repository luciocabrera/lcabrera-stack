import * as stylex from '@stylexjs/stylex';

import { useGetNormalizedColumn } from '@repo/ui/components/Table/contexts/TableConfig/columns/selectors';

import type { DetailItem, DetailsSectionProps } from './DetailsSection.types';

import { styles } from './DetailsSection.stylex';
import { getBadgeStyle } from './utils';

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

  const details: DetailItem[] = [
    { label: 'Label', value: label },
    { isMono: true, label: 'Key', value: key },
    { label: 'Data Type', value: dataType ?? '—' },
    {
      isBadge: true,
      label: 'Sortable',
      value: isSortable === false ? 'No' : 'Yes',
    },
    {
      isBadge: true,
      label: 'Filterable',
      value: isFilterable === false ? 'No' : 'Yes',
    },
    {
      isBadge: true,
      label: 'Sort Direction',
      value: sortDirection ?? 'None',
    },
    { label: 'Min Width', value: minWidth ? `${String(minWidth)}px` : '—' },
    { label: 'Max Width', value: maxWidth ? `${String(maxWidth)}px` : '—' },
  ];

  return (
    <div {...stylex.props(styles.container)}>
      {details.map((detail, index) => {
        const isLast = index === details.length - 1;
        const monoStyle = detail.isMono ? styles.mono : undefined;
        const valueElement = detail.isBadge ? (
          <span {...stylex.props(styles.badge, getBadgeStyle(detail.value))}>
            {detail.value}
          </span>
        ) : (
          <span {...stylex.props(styles.value, monoStyle)}>{detail.value}</span>
        );

        return (
          <div
            key={detail.label}
            {...stylex.props(styles.item, isLast ? styles.itemLast : undefined)}
          >
            <span {...stylex.props(styles.label)}>{detail.label}</span>
            {valueElement}
          </div>
        );
      })}
    </div>
  );
};
