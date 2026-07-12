import { Button } from '@repo/ui/components/Button';
import * as stylex from '@stylexjs/stylex';

import { styles } from '../Settings.stylex';
import {
  useAcceptSettingsDraft,
  useCancelSettingsDraft,
} from '../SettingsDraftContext/actions';
import { useGetSettingsDraftChanges } from '../SettingsDraftContext/selectors';

/**
 * Accept/Cancel row of the global settings page. Owns its store wiring:
 * derives the dirty flag and dispatches the commit/discard draft actions
 * itself.
 */
export const SettingsActions = () => {
  const { hasChanges } = useGetSettingsDraftChanges();
  const acceptSettingsDraft = useAcceptSettingsDraft();
  const cancelSettingsDraft = useCancelSettingsDraft();

  return (
    <div {...stylex.props(styles.actions)}>
      <Button
        color='primary'
        isDisabled={!hasChanges}
        onClick={acceptSettingsDraft}
        size='sm'
      >
        Accept
      </Button>
      <Button color='outline' onClick={cancelSettingsDraft} size='sm'>
        Cancel
      </Button>
    </div>
  );
};
