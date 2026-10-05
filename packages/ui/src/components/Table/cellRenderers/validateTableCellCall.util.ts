import type {
  StandardSchemaV1Result,
  TableCellCall,
  TableCellRenderer,
} from '#ui/components/Table/Table.types';

import type { TableCellCallOutcome } from './cellRenderers.types';

type ValidateTableCellCallArgs = {
  readonly call: TableCellCall;
  readonly renderers: ReadonlyMap<string, TableCellRenderer>;
};

const ASYNC_ISSUE = {
  message: 'params must validate synchronously to render a cell',
};

export const validateTableCellCall = ({
  call,
  renderers,
}: ValidateTableCellCallArgs): TableCellCallOutcome => {
  const { kind } = call;
  const renderer = renderers.get(kind);

  if (renderer === undefined) return { kind, status: 'unregistered' };

  const readResult = (): StandardSchemaV1Result<unknown> => {
    try {
      const result = renderer.params['~standard'].validate(call.params ?? {});

      return result instanceof Promise ? { issues: [ASYNC_ISSUE] } : result;
    } catch (error) {
      return {
        issues: [
          { message: error instanceof Error ? error.message : String(error) },
        ],
      };
    }
  };
  const result = readResult();

  if (result.issues !== undefined) {
    return { issues: result.issues, kind, status: 'invalid' };
  }

  return { kind, params: result.value, renderer, status: 'resolved' };
};
