import type { TableDensityPatch } from '#ui/components/Table/Table.types';

type ToTableDensityPatchArgs = {
  readonly current: TableDensityPatch;
  readonly staged: TableDensityPatch;
};

export const toTableDensityPatch = ({
  current,
  staged,
}: ToTableDensityPatchArgs): TableDensityPatch => ({
  ...(staged.density !== current.density && { density: staged.density }),
  ...(staged.headerDensity !== current.headerDensity && {
    headerDensity: staged.headerDensity,
  }),
});
