import { HEADER_ARIA_ROW_INDEX } from './resolveGridRowIndexing.util';

type ResolveFooterAriaRowIndexArgs = {
  readonly totalRows: number;
};

export const resolveFooterAriaRowIndex = ({
  totalRows,
}: ResolveFooterAriaRowIndexArgs) => totalRows + HEADER_ARIA_ROW_INDEX + 1;
