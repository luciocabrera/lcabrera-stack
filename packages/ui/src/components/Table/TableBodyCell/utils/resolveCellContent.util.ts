import type { ReactNode } from 'react';

import { renderCellContent } from './renderCellContent.util';

type ResolveCellContentArgs = Parameters<typeof renderCellContent>[0] & {
  readonly children: ReactNode;
};

export const resolveCellContent = ({
  children,
  ...args
}: ResolveCellContentArgs) =>
  children === undefined ? renderCellContent(args) : children;
