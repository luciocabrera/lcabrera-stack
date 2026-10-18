import { codeSpan } from './codeSpan.util.ts';

export const narrowedLine = (subjects: readonly string[]) =>
  subjects.length === 0
    ? []
    : [
        `Narrowed to ${subjects.map((name) => codeSpan(name)).join(', ')}: only their tasks are compared, while cost and duration are each whole run's.`,
      ];
