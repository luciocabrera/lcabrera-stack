import type {
  StandardSchemaV1Issue,
  StandardSchemaV1Result,
  TableCellRenderer,
  TableCellToneColors,
} from '#ui/components/Table/Table.types';

export type TableCellCallBinding = {
  readonly outcome: TableCellCallOutcome | undefined;
  readonly tone: (name: string) => TableCellToneColors;
};

export type TableCellCallOutcome =
  | {
      readonly issues: readonly StandardSchemaV1Issue[];
      readonly kind: string;
      readonly status: 'invalid';
    }
  | {
      readonly kind: string;
      readonly params: unknown;
      readonly renderer: TableCellRenderer;
      readonly status: 'resolved';
    }
  | { readonly kind: string; readonly status: 'unregistered' };

export type TableCellParamsParser<TParams> = (
  value: unknown,
) => StandardSchemaV1Result<TParams>;
