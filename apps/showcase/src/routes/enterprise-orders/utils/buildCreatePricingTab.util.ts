import { buildPricingInputsGroup } from './buildPricingInputsGroup.util';

export const buildCreatePricingTab = () => ({
  fields: [buildPricingInputsGroup()],
  label: 'Pricing',
});
