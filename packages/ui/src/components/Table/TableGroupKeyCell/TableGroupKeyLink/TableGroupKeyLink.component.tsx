import { useGetTableGroupDetailsPath } from '#ui/components/Table/contexts/TableConfig/meta/selectors';

import type { TableGroupKeyLinkProps } from './TableGroupKeyLink.types';

import { TableGroupDetailsAnchor } from '../TableGroupDetailsAnchor';

export const TableGroupKeyLink = ({
  groupingKeys,
  summary,
  text,
}: TableGroupKeyLinkProps) => {
  const groupDetailsPath = useGetTableGroupDetailsPath();

  if (groupDetailsPath === undefined) return text;

  return (
    <TableGroupDetailsAnchor
      groupDetailsPath={groupDetailsPath}
      groupingKeys={groupingKeys}
      summary={summary}
      text={text}
    />
  );
};
