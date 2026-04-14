import { styles } from '../DetailsSection.stylex';

export const getBadgeStyle = (value: string) => {
  if (value === 'Yes') return styles.badgeYes;
  if (value === 'No') return styles.badgeNo;
  return styles.badgeNone;
};
