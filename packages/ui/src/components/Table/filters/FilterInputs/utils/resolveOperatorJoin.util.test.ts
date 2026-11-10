import { describe, expect, it } from 'vite-plus/test';

import { styles } from '../FilterInputs.stylex';
import { resolveOperatorJoin } from './resolveOperatorJoin.util';

const optionListArgs: Parameters<typeof resolveOperatorJoin>[0] = {
  dataType: 'string',
  filter: { type: 'select', values: [] },
  hasFetchableOptions: true,
  operator: 'equals',
};

describe('resolveOperatorJoin', () => {
  it('attaches the operator by its bottom edge and closes the gap over an option list', () => {
    expect(resolveOperatorJoin(optionListArgs)).toStrictEqual({
      attachedEdge: 'bottom',
      containerStyle: styles.containerJoined,
    });
  });

  it('leaves the operator detached over any other value input', () => {
    expect(
      resolveOperatorJoin({ ...optionListArgs, operator: 'contains' }),
    ).toStrictEqual({ attachedEdge: undefined, containerStyle: undefined });
  });
});
