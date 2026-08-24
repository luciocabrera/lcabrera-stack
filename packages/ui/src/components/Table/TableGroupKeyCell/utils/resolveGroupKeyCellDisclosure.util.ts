import type {
  TableGroupDisclosureProps,
  TableGroupDisclosureState,
} from '#ui/components/Table/TableGroupDisclosure';

type ResolveGroupKeyCellDisclosureArgs = {
  readonly columnKey: string;
  readonly disclosure: TableGroupDisclosureState | undefined;
};

const NO_LEVEL_DISCLOSURES: TableGroupDisclosureState['levelDisclosures'] = [];

export const resolveGroupKeyCellDisclosure = ({
  columnKey,
  disclosure,
}: ResolveGroupKeyCellDisclosureArgs):
  | TableGroupDisclosureProps
  | undefined => {
  const level = disclosure?.levelDisclosures.find(
    (entry) => entry.columnKey === columnKey,
  );

  if (level !== undefined)
    return {
      disclosure: {
        hasChildren: true,
        isExpanded: level.isExpanded,
        levelDisclosures: NO_LEVEL_DISCLOSURES,
      },
      path: level.path,
    };

  return undefined;
};
