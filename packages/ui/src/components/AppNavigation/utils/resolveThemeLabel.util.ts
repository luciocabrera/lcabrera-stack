export const resolveThemeLabel = (isDarkMode: boolean) => {
  if (isDarkMode) {
    return 'Light Mode';
  }

  return 'Dark Mode';
};
