export const toOwnStackMetaState = (title: string | undefined) =>
  title === undefined ? {} : { title: { plural: title, singular: 'Row' } };
