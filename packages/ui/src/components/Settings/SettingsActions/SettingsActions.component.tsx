import { ActionButtons } from '@repo/ui/components/ActionButtons';

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
    <ActionButtons
      actions={[
        {
          isDisabled: !hasChanges,
          label: 'Accept',
          onClick: acceptSettingsDraft,
        },
        {
          label: 'Cancel',
          onClick: cancelSettingsDraft,
          variant: 'outline',
        },
      ]}
      customStylex={styles.actions}
    />
  );
};
