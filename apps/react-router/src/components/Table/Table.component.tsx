import * as stylex from "@stylexjs/stylex";

import { useRenderTracker } from "@/utils/performance";

import type { TableProps } from "./Table.types.ts";

import { TableDataProvider } from "./contexts/index.ts";
import { styles } from "./Table.stylex.ts";
import { TableContent } from "./TableContent/index.ts";

export const Table = <TData extends Record<string, unknown>, TResponse>({
  actions,
  dataSelector,
  dataTotalSelector,
  icon,
  isFlexWrapperEnabled = true,
  isLoading = false,
  onLoadMore,
  response,
}: TableProps<TData, TResponse>) => {
  useRenderTracker({ componentName: "Table" });
  const data = dataSelector ? dataSelector(response) : ([] as unknown as TData[]);
  const totalRows = dataTotalSelector ? dataTotalSelector(response) : data.length;

  const tableContent = (
    <TableDataProvider<TData>
      dataState={{
        data,
        isLoading,
        totalRows,
      }}
    >
      <TableContent
        actions={actions}
        dataSelector={dataSelector}
        dataTotalSelector={dataTotalSelector}
        icon={icon}
        onLoadMore={onLoadMore}
      />
    </TableDataProvider>
  );

  if (isFlexWrapperEnabled) return <div {...stylex.props(styles.wrapper)}>{tableContent}</div>;

  return tableContent;
};
