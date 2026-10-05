import { styles } from '../DetailsSection.stylex';

export const getBadgeStyle = (value: string) => {
  if (value === 'Yes') return styles.badgeYes;
  return value === 'No' ? styles.badgeNo : styles.badgeNone;
};
