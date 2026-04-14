import { describe, expect, it } from 'vitest';

import { createJsonFieldsParser } from './parseJsonQueryFields.util';

describe('createJsonFieldsParser', () => {
  it('parses configured JSON query fields in place', async () => {
    const request = {
      query: {
        filters: '{"status":["eq","paid"]}',
        sort: '[{"columnKey":"id","direction":"asc"}]',
      },
    };
    const parseJsonFields = createJsonFieldsParser(['filters', 'sort']);

    await parseJsonFields(request as never);

    expect(request.query).toEqual({
      filters: { status: ['eq', 'paid'] },
      sort: [{ columnKey: 'id', direction: 'asc' }],
    });
  });

  it('leaves invalid JSON strings and non-string values untouched', async () => {
    const request = {
      query: {
        filters: '{bad json}',
        skip: 10,
      },
    };
    const parseJsonFields = createJsonFieldsParser(['filters', 'skip']);

    await parseJsonFields(request as never);

    expect(request.query).toEqual({
      filters: '{bad json}',
      skip: 10,
    });
  });
});
