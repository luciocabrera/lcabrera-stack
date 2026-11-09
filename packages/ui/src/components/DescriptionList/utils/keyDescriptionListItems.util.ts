import type { DescriptionListItem } from '../DescriptionList.types';

export const keyDescriptionListItems = (
  items: readonly DescriptionListItem[],
) => {
  const seen = new Map<string, number>();

  return items.map((item) => {
    const occurrence = (seen.get(item.term) ?? 0) + 1;

    seen.set(item.term, occurrence);

    return { item, key: `${occurrence}:${item.term}` };
  });
};
