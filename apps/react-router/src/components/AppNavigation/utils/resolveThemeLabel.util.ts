/** Returns the accessible label for the theme toggle button. */
export const resolveThemeLabel = (isDarkMode: boolean): string => {
  if (isDarkMode) {
    return 'Light Mode';
  }

  return 'Dark Mode';
};
