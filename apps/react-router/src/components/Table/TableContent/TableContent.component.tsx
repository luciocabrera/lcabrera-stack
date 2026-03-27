import * as stylex from "@stylexjs/stylex";
import { useRef } from "react";

import { Button } from "@/components/Button";
import { SettingsIcon } from "@/components/Icons";
import { useRenderTracker } from "@/utils/performance";

import type { TableContentProps } from "./TableContent.types.ts";

import { useToogleTableIsTableSettingsOpen } from "../contexts/TableConfig/meta/actions/index.ts";
import { useGetTableThreshold } from "../contexts/TableConfig/meta/selectors/index.ts";
import { useFetchMoreData } from "../contexts/TableData/data/actions/index.ts";
import {
  useGetTableHasMore,
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from "../contexts/TableData/data/selectors/index.ts";
import { TableWrapperContext } from "../contexts/TableWrapper/TableWrapperContext.context.ts";
import { useInfiniteScroll } from "../hooks/index.ts";
import { TableBase } from "../TableBase/index.ts";
import { TableBody } from "../TableBody/index.ts";
import { TableDrawersSection } from "../TableDrawersSection/index.ts";
import { TableHeader } from "../TableHeader/index.ts";
import { TableTitle } from "../TableTitle/index.ts";
import { styles } from "./TableContent.stylex.ts";

export const TableContent = <TData extends Record<string, unknown>, TResponse>({
  actions,
  dataSelector,
  dataTotalSelector,
  icon,
  onLoadMore,
}: TableContentProps<TData, TResponse>) => {
  useRenderTracker({ componentName: "TableContent" });

  const threshold = useGetTableThreshold();
  const isLoading = useGetTableIsLoading();
  const isLoadingMore = useGetTableIsLoadingMore();
  const hasMore = useGetTableHasMore();

  const fetchMoreData = useFetchMoreData<TData, TResponse>();

  const toogleTableIsTableSettingsOpen = useToogleTableIsTableSettingsOpen();

  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const wrapperContextValue = { containerRef, wrapperRef };

  useInfiniteScroll({
    dataSelector,
    dataTotalSelector,
    fetchMoreData,
    hasMore,
    isLoadingMore,
    onLoadMore,
    scrollContainerRef: containerRef,
    threshold,
  });

  return (
    <TableWrapperContext value={wrapperContextValue}>
      <div ref={wrapperRef} {...stylex.props(styles.wrapper)}>
        <div {...stylex.props(styles.outerContainer)}>
          <TableTitle
            actions={
              <>
                {actions}
                <Button
                  aria-label="Table settings"
                  color="ghost"
                  icon={<SettingsIcon size={16} />}
                  onClick={toogleTableIsTableSettingsOpen}
                  size="mini"
                />
              </>
            }
            icon={icon}
          />
          <div
            data-scroll-locked={String(isLoading)}
            ref={containerRef}
            {...stylex.props(styles.container, isLoading && styles.containerLocked)}
          >
            <TableBase>
              <TableHeader />
              <TableBody tableContainerRef={containerRef} />
            </TableBase>
          </div>
        </div>
        <TableDrawersSection />
      </div>
    </TableWrapperContext>
  );
};
