import { describe, expect, it } from 'vite-plus/test';

import { createBasicColumn } from './createBasicColumn.util';

type Row = {
  amount: number;
  id: number;
  name: string;
};

describe('createBasicColumn', () => {
  it('builds a basic table column with provided metadata', () => {
    const result = createBasicColumn<Row>({
      dataType: 'number',
      key: 'amount',
      label: 'Amount',
      maxWidth: 180,
      minWidth: 120,
    });

    expect(result).toStrictEqual({
      dataType: 'number',
      key: 'amount',
      label: 'Amount',
      maxWidth: 180,
      minWidth: 120,
    });
  });
});
