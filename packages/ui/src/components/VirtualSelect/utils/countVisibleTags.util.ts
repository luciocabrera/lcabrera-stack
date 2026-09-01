import { TRIGGER_MAX_HEIGHT } from '../VirtualSelectTrigger/VirtualSelectTrigger.stylex';

export type CountVisibleTagsArgs = {
  readonly totalCount: number;
  readonly trigger: HTMLElement;
};
export const countVisibleTags = ({
  totalCount,
  trigger,
}: CountVisibleTagsArgs) => {
  const children = [...trigger.children] as HTMLElement[];
  const tagElements = children.filter(
    (child) => !child.dataset.chevron && !child.dataset.overflow,
  );

  let fittingCount = 0;
  for (const tag of tagElements) {
    if (tag.offsetTop + tag.offsetHeight <= TRIGGER_MAX_HEIGHT) {
      fittingCount++;
    } else {
      break;
    }
  }

  const overflow = totalCount - fittingCount;

  if (overflow > 0) {
    return Math.max(1, fittingCount - 1);
  }

  return fittingCount;
};
