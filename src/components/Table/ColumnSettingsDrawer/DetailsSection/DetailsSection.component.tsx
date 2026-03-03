import * as stylex from '@stylexjs/stylex';

import { useGetNormalizedColumn } from '@/components/Table/contexts/TableConfig/columns/selectors';

import type { DetailItem, DetailsSectionProps } from './DetailsSection.types';

import { styles } from './DetailsSection.stylex';

const getBadgeStyle = (value: string) => {
  if (value === 'Yes') return styles.badgeYes;
  if (value === 'No') return styles.badgeNo;
  return styles.badgeNone;
};

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
      {details.map((detail, index) => (
        <div
          key={detail.label}
          {...stylex.props(
            styles.item,
            index === details.length - 1 ? styles.itemLast : undefined,
          )}
        >
          <span {...stylex.props(styles.label)}>{detail.label}</span>
          {detail.isBadge ? (
            <span {...stylex.props(styles.badge, getBadgeStyle(detail.value))}>
              {detail.value}
            </span>
          ) : (
            <span
              {...stylex.props(
                styles.value,
                detail.isMono ? styles.mono : undefined,
              )}
            >
              {detail.value}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
