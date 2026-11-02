export const formatUtcTime = (iso: string) =>
  iso
    .slice(11, 23)
    .replace(/\.000$/u, '')
    .replace(/^(\d\d:\d\d):00$/u, '$1')
    .replace(/^00:00$/u, '');
