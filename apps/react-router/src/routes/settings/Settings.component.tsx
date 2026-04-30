import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import {
  PIN_CONFLICT_PREFERENCE_OPTIONS,
  PIN_SIDE_PREFERENCE_OPTIONS,
  UNPIN_CONFLICT_PREFERENCE_OPTIONS,
} from '@/constants/pinningPreferences.constants';
import { useSetGlobalPinningPreferences } from '@/contexts/GlobalSettingsContext/actions';
import { useGetGlobalPinningPreferences } from '@/contexts/GlobalSettingsContext/selectors';

import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { RadioOptionGroup } from '@/components/RadioOptionGroup';

import type {
  PinConflictResolutionPreferenceOption,
  PinSidePreferenceOption,
  UnpinConflictResolutionPreferenceOption,
} from '@/types/pinningPreferences.types';

import { styles } from './Settings.stylex';

type PinningPreferencesDraft = {
  readonly pinConflictResolution: PinConflictResolutionPreferenceOption;
  readonly pinSide: PinSidePreferenceOption;
  readonly unpinConflictResolution: UnpinConflictResolutionPreferenceOption;
};

const toDraft = (
  pinningPreferences: ReturnType<typeof useGetGlobalPinningPreferences>,
): PinningPreferencesDraft => {
  return {
    pinConflictResolution:
      pinningPreferences.pinConflictResolution ?? 'always-ask',
    pinSide: pinningPreferences.pinSide ?? 'always-ask',
    unpinConflictResolution:
      pinningPreferences.unpinConflictResolution ?? 'always-ask',
  };
};

export const Settings = () => {
  const pinningPreferences = useGetGlobalPinningPreferences();
  const setGlobalPinningPreferences = useSetGlobalPinningPreferences();

  const [draft, setDraft] = useState<PinningPreferencesDraft>(() => {
    return toDraft(pinningPreferences);
  });

  const hasChanges =
    draft.pinSide !== (pinningPreferences.pinSide ?? 'always-ask') ||
    draft.pinConflictResolution !==
      (pinningPreferences.pinConflictResolution ?? 'always-ask') ||
    draft.unpinConflictResolution !==
      (pinningPreferences.unpinConflictResolution ?? 'always-ask');

  const handleAccept = (): void => {
    if (!hasChanges) {
      return;
    }

    setGlobalPinningPreferences({
      pinConflictResolution:
        draft.pinConflictResolution === 'always-ask'
          ? undefined
          : draft.pinConflictResolution,
      pinSide: draft.pinSide === 'always-ask' ? undefined : draft.pinSide,
      unpinConflictResolution:
        draft.unpinConflictResolution === 'always-ask'
          ? undefined
          : draft.unpinConflictResolution,
    });
  };

  const handleCancel = (): void => {
    setDraft(toDraft(pinningPreferences));
  };

  const handlePinSideChange = (value: PinSidePreferenceOption): void => {
    setDraft((currentDraft) => {
      return {
        ...currentDraft,
        pinSide: value,
      };
    });
  };

  const handlePinConflictChange = (
    value: PinConflictResolutionPreferenceOption,
  ): void => {
    setDraft((currentDraft) => {
      return {
        ...currentDraft,
        pinConflictResolution: value,
      };
    });
  };

  const handleUnpinConflictChange = (
    value: UnpinConflictResolutionPreferenceOption,
  ): void => {
    setDraft((currentDraft) => {
      return {
        ...currentDraft,
        unpinConflictResolution: value,
      };
    });
  };

  return (
    <div {...stylex.props(styles.container)}>
      <h1 {...stylex.props(styles.title)}>Global Settings</h1>
      <p {...stylex.props(styles.description)}>
        Preferences in this page are global and apply to all tables.
      </p>

      <Card color='default' elevation='sm' padding='lg'>
        <section {...stylex.props(styles.section)}>
          <h2 {...stylex.props(styles.sectionTitle)}>Pin Side Preference</h2>
          <p {...stylex.props(styles.description)}>
            Used when pinning a column. If set to Always ask, the pin side modal
            will be shown every time.
          </p>
          <RadioOptionGroup
            name='settings-pin-side-preference'
            onChange={handlePinSideChange}
            options={PIN_SIDE_PREFERENCE_OPTIONS}
            value={draft.pinSide}
          />
        </section>
      </Card>

      <Card color='default' elevation='sm' padding='lg'>
        <section {...stylex.props(styles.section)}>
          <h2 {...stylex.props(styles.sectionTitle)}>
            Pin Conflict Preference
          </h2>
          <p {...stylex.props(styles.description)}>
            Used when a pin action creates a contiguity conflict.
          </p>
          <RadioOptionGroup
            name='settings-pin-conflict-preference'
            onChange={handlePinConflictChange}
            options={PIN_CONFLICT_PREFERENCE_OPTIONS}
            value={draft.pinConflictResolution}
          />
        </section>
      </Card>

      <Card color='default' elevation='sm' padding='lg'>
        <section {...stylex.props(styles.section)}>
          <h2 {...stylex.props(styles.sectionTitle)}>
            Unpin Conflict Preference
          </h2>
          <p {...stylex.props(styles.description)}>
            Used when unpinning a column would leave a gap in a pinned block.
          </p>
          <RadioOptionGroup
            name='settings-unpin-conflict-preference'
            onChange={handleUnpinConflictChange}
            options={UNPIN_CONFLICT_PREFERENCE_OPTIONS}
            value={draft.unpinConflictResolution}
          />
        </section>
      </Card>

      <div {...stylex.props(styles.actions)}>
        <Button color='outline' onClick={handleCancel} size='sm'>
          Cancel
        </Button>
        <Button
          color='primary'
          isDisabled={!hasChanges}
          onClick={handleAccept}
          size='sm'
        >
          Accept
        </Button>
      </div>
    </div>
  );
};
