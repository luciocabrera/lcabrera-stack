import { useGetIsTopAttached } from '#ui/components/VirtualList/contexts/list/selectors';

import {
  useGetAttachedEdge,
  useGetIsInert,
  useGetIsOpen,
} from '../../contexts/meta/selectors';
import { getTriggerStyleProps } from '../utils';

type UseTriggerStylePropsArgs = {
  readonly hasTags: boolean;
  readonly isStatic: boolean;
};

export const useTriggerStyleProps = ({
  hasTags,
  isStatic,
}: UseTriggerStylePropsArgs) => {
  const attachedEdge = useGetAttachedEdge();
  const isAttachedBelow = useGetIsTopAttached();
  const isInert = useGetIsInert();
  const isOpen = useGetIsOpen();

  return getTriggerStyleProps({
    attachedEdge,
    hasTags,
    isAttachedBelow,
    isInert,
    isOpen,
    isStatic,
  });
};
