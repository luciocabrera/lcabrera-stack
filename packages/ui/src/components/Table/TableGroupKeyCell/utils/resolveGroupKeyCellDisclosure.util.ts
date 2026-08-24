import type {
  TableGroupDisclosureProps,
  TableGroupDisclosureState,
} from '#ui/components/Table/TableGroupDisclosure';

type ResolveGroupKeyCellDisclosureArgs = {
  readonly columnKey: string;
  readonly disclosure: TableGroupDisclosureState | undefined;
};

const NO_LEVEL_DISCLOSURES: TableGroupDisclosureState['levelDisclosures'] = [];

/**
 * Which control this key cell draws, and for which group — or `undefined` when
 * it draws only the reserved space.
 *
 * A cell draws the fold for the level its own column states, which is why the
 * disclosure it hands back is rebuilt from that level rather than passed
 * through: the row's own state answers for the row, not for the ancestor this
 * column names (#802).
 */
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
