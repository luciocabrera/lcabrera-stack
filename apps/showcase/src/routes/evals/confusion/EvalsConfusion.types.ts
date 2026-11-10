import type { loader } from './evals-confusion.loader';

export type ConfusionCell =
  ConfusionMatrixData['rows'][number]['cells'][number];

export type ConfusionCellProps = {
  readonly cell: ConfusionCell | undefined;
};

export type ConfusionMatrixData = LoaderData['matrix'];

export type ConfusionMatrixProps = {
  readonly matrix: ConfusionMatrixData;
  readonly scope: string;
};

export type ConfusionRunPickerProps = Pick<
  LoaderData,
  'choices' | 'selectedRunId'
>;

export type ConfusionTableRow = Readonly<
  Record<`loaded:${string}`, ConfusionCell>
> & {
  readonly expected: string;
  readonly trials: number;
};

type LoaderData = Awaited<ReturnType<typeof loader>>;
