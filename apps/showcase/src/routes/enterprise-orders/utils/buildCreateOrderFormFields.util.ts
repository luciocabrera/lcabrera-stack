import { buildCreateNotesTab } from './buildCreateNotesTab.util';
import { buildCreateOrderTab } from './buildCreateOrderTab.util';
import { buildCreatePricingTab } from './buildCreatePricingTab.util';
import { toOrderFormFields } from './toOrderFormFields.util';

export const buildCreateOrderFormFields = () =>
  toOrderFormFields({
    notesTab: buildCreateNotesTab(),
    orderTab: buildCreateOrderTab(),
    pricingTab: buildCreatePricingTab(),
  });
