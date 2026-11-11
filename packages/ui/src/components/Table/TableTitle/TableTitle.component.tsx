import { use } from 'react';

import { Title } from '#ui/components/Title/Title.component';

import type { TableTitleProps } from './TableTitle.types';

import {
  useGetTableTitleDensity,
  useGetTableTitlePlural,
} from '../contexts/TableConfig/meta/selectors';
import { TablePresentationContext } from '../contexts/TableConfig/TablePresentationContext.context';
import { TABLE_TITLE_DENSITY_SIZE } from '../Table.constants';

export const TableTitle = ({
  actions,
  customStylex,
  icon,
}: TableTitleProps) => {
  const title = useGetTableTitlePlural();
  const titleDensity = useGetTableTitleDensity();
  const { features } = use(TablePresentationContext);

  if (!features.toolbar) return;

  return (
    <Title
      actions={actions}
      customStylex={customStylex}
      icon={icon}
      size={TABLE_TITLE_DENSITY_SIZE[titleDensity]}
    >
      {title}
    </Title>
  );
};
