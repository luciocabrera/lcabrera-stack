import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';

import type { TableGroupTreeRowMeta } from './resolveTableGroupTree.util';

type CollectGroupLevelFoldPathsArgs = {
  readonly columnKey: string;
  readonly rowMeta: readonly TableGroupTreeRowMeta[] | undefined;
};

export const collectGroupLevelFoldPaths = ({
  columnKey,
  rowMeta,
}: CollectGroupLevelFoldPathsArgs): ReadonlySet<string> =>
  new Set(
    (rowMeta ?? []).flatMap(({ levelDisclosures }) =>
      levelDisclosures
        .filter((disclosure) => disclosure.columnKey === columnKey)
        .map(({ path }) => resolveGroupPathKey(path)),
    ),
  );
