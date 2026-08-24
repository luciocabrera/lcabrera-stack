type ResolveGroupExpansionKeyArgs = {
  readonly hasChildren: boolean;
  readonly isExpanded: boolean;
  readonly isGroupRow: boolean;
  readonly key: string;
};

export const resolveGroupExpansionKey = ({
  hasChildren,
  isExpanded,
  isGroupRow,
  key,
}: ResolveGroupExpansionKeyArgs) => {
  if (!isGroupRow || !hasChildren) return;

  if (key === 'ArrowRight' && !isExpanded) return 'expand' as const;

  if (key === 'ArrowLeft' && isExpanded) return 'collapse' as const;
};
