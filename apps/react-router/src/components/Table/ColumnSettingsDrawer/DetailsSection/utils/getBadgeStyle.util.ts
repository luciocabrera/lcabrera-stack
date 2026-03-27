import { styles } from "../DetailsSection.stylex.ts";

export const getBadgeStyle = (value: string) => {
  if (value === "Yes") return styles.badgeYes;
  if (value === "No") return styles.badgeNo;
  return styles.badgeNone;
};
