import { Title } from '#ui/components/Title/Title.component';

import type { TableTitleProps } from './TableTitle.types';

import { useGetTableTitlePlural } from '../contexts/TableConfig/meta/selectors';

export const TableTitle = ({
  actions,
  customStylex,
  icon,
}: TableTitleProps) => {
  const title = useGetTableTitlePlural();

  return (
    <Title actions={actions} customStylex={customStylex} icon={icon}>
      {title}
    </Title>
  );
};
