import {
  selectAdjudicationAccuracy,
  selectAdjudicationCases,
  selectAdjudicationVerdicts,
} from '../.server/evalsHistory.service';
import { requireEvalsDashboard } from '../.server/requireEvalsDashboard.service';
import { adjudicationsView } from './adjudicationsView.util';

export const loader = async () => {
  requireEvalsDashboard();

  const [accuracy, cases, verdicts] = await Promise.all([
    selectAdjudicationAccuracy(),
    selectAdjudicationCases(),
    selectAdjudicationVerdicts(),
  ]);

  return adjudicationsView({ accuracy, cases, verdicts });
};
