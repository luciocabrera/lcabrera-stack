import { describe, expect, it } from 'vite-plus/test';

import { EVALS_BASE_COLUMNS_SQL } from './queries.constants.ts';
import {
  readPublicColumns,
  readSchemaColumns,
} from './readPublicColumns.service.ts';
import { recordingClient } from './recordingClient.util.ts';

const rows = [
  {
    column: 'duration_ms',
    dataType: 'integer',
    table: 'eval_trial',
    udtName: 'int4',
  },
  {
    column: 'transcript_uri',
    dataType: 'text',
    table: 'eval_trial',
    udtName: 'text',
  },
];

describe('readSchemaColumns', () => {
  it('reads the base columns of schema evals', async () => {
    const { client, sent } = recordingClient(rows);

    expect(await readSchemaColumns({ client })).toEqual(rows);
    expect(sent).toEqual([{ text: EVALS_BASE_COLUMNS_SQL, values: [] }]);
  });

  it('rejects a row without a data type', async () => {
    const { client } = recordingClient([{ ...rows[0], dataType: undefined }]);

    await expect(readSchemaColumns({ client })).rejects.toThrow();
  });
});

describe('readPublicColumns', () => {
  it('derives the public set from the columns it read', async () => {
    const { client } = recordingClient(rows);

    expect(await readPublicColumns({ client })).toEqual(
      new Set(['eval_trial.duration_ms']),
    );
  });
});
