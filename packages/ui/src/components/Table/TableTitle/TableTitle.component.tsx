import { use } from 'react';

import { Title } from '#ui/components/Title/Title.component';

import type { TableTitleProps } from './TableTitle.types';

import { useGetTableTitlePlural } from '../contexts/TableConfig/meta/selectors';
import { TablePresentationContext } from '../contexts/TableConfig/TablePresentationContext.context';

export const TableTitle = ({
  actions,
  customStylex,
  icon,
}: TableTitleProps) => {
  const title = useGetTableTitlePlural();
  const { features } = use(TablePresentationContext);

  if (!features.toolbar) return;

  return (
    <Title actions={actions} customStylex={customStylex} icon={icon}>
      {title}
    </Title>
  );
};
