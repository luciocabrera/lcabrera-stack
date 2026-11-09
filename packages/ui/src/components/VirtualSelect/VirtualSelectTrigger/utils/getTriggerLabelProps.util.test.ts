import { describe, expect, it } from 'vite-plus/test';

import { getTriggerLabelProps } from './getTriggerLabelProps.util';

describe('getTriggerLabelProps', () => {
  it('names the trigger by the label and then by its own content', () => {
    expect(getTriggerLabelProps({ labelId: 'status' })).toStrictEqual({
      'aria-labelledby': 'status status-trigger',
      id: 'status-trigger',
    });
  });

  it('adds nothing when the select has no visible label', () => {
    expect(getTriggerLabelProps({ labelId: undefined })).toStrictEqual({});
  });
});
