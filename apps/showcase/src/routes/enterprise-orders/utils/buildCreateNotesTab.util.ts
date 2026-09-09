import { buildNotesGroup } from './buildNotesGroup.util';

export const buildCreateNotesTab = () => ({
  fields: [buildNotesGroup()],
  label: 'Notes & Audit',
});
