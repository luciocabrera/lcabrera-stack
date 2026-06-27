import { Title } from '@/components/Title/Title.component';

import type { TableTitleProps } from './TableTitle.types';

import { useGetTableTitle } from '../contexts/TableConfig/meta/selectors';

export const TableTitle = ({
  actions,
  customStylex,
  icon,
}: TableTitleProps) => {
  const title = useGetTableTitle();

  return (
    <Title actions={actions} customStylex={customStylex} icon={icon}>
      {title}
    </Title>
  );
};
