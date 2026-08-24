import { ActionButtons } from '#ui/components/ActionButtons';

import { styles } from '../Settings.stylex';
import {
  useAcceptSettingsDraft,
  useCancelSettingsDraft,
} from '../SettingsDraftContext/actions';
import { useGetSettingsDraftChanges } from '../SettingsDraftContext/selectors';

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
