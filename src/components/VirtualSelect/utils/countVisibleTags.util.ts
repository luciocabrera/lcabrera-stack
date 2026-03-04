import { TRIGGER_MAX_HEIGHT } from '../VirtualSelect.stylex';

export type CountVisibleTagsArgs = {
  totalCount: number;
  trigger: HTMLDivElement;
};
/**
 * Counts how many tag children fit within height limit.
 * Returns adjusted count reserving space for the "+N more" overflow tag.
 */
export const countVisibleTags = ({
  totalCount,
  trigger,
}: CountVisibleTagsArgs) => {
  const children = [...trigger.children] as HTMLElement[];
  const tagElements = children.filter((child) => !child.dataset.chevron);

  let fittingCount = 0;
  for (const tag of tagElements) {
    if (tag.offsetTop + tag.offsetHeight <= TRIGGER_MAX_HEIGHT) {
      fittingCount++;
    } else {
      break;
    }
  }

  const overflow = totalCount - fittingCount;
  return overflow > 0 && fittingCount > 0 ? fittingCount - 1 : fittingCount;
};
