import { styles } from '../FilterInputs.stylex';
import { isValueSelectList } from './isValueSelectList.util';

type ResolveOperatorJoinArgs = Parameters<typeof isValueSelectList>[0];

export const resolveOperatorJoin = (args: ResolveOperatorJoinArgs) =>
  isValueSelectList(args)
    ? {
        attachedEdge: 'bottom' as const,
        containerStyle: styles.containerJoined,
      }
    : { attachedEdge: undefined, containerStyle: undefined };
