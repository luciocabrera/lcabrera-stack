import { buildEditNotesTab } from './buildEditNotesTab.util';
import { buildEditOrderTab } from './buildEditOrderTab.util';
import { buildEditPricingTab } from './buildEditPricingTab.util';
import { toOrderFormFields } from './toOrderFormFields.util';

export const buildEditOrderFormFields = () =>
  toOrderFormFields({
    notesTab: buildEditNotesTab(),
    orderTab: buildEditOrderTab(),
    pricingTab: buildEditPricingTab(),
  });
