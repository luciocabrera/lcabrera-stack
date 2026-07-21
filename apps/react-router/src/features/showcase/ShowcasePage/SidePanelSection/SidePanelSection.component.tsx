import { Button } from '@repo/ui/components/Button';
import {
  Card,
  CardBody,
  CardDescription,
  CardTitle,
} from '@repo/ui/components/Card';
import {
  InfoIcon,
  MenuCloseIcon,
  MenuIcon,
  SettingsIcon,
  SuccessIcon,
} from '@repo/ui/components/Icons';
import {
  SidePanel,
  SidePanelBody,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
} from '@repo/ui/components/SidePanel';
import { ICON_SIZE_MD } from '@repo/ui/design-system/constants';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { styles as pageStyles } from '../ShowcasePage.stylex';
import { ShowcaseSection } from '../ShowcaseSection';
import { ShowcaseSubsection } from '../ShowcaseSubsection';
import { styles } from './SidePanelSection.stylex';

export const SidePanelSection = () => {
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  const handleOpenLeft = () => {
    setIsLeftPanelOpen(true);
  };
  const handleOpenRight = () => {
    setIsRightPanelOpen(true);
  };
  const handleCloseLeft = () => {
    setIsLeftPanelOpen(false);
  };
  const handleCloseRight = () => {
    setIsRightPanelOpen(false);
  };

  return (
    <>
      <ShowcaseSection title='Side Panels'>
        <ShowcaseSubsection title='Positions & Sizes'>
          <div {...stylex.props(pageStyles.buttonGrid)}>
            <Button
              icon={<MenuIcon size={ICON_SIZE_MD} />}
              onClick={handleOpenLeft}
            >
              Open Left Panel
            </Button>
            <Button onClick={handleOpenRight}>
              <span>Open Right Panel</span>
              <span {...stylex.props(styles.iconRight)}>
                <MenuIcon size={ICON_SIZE_MD} />
              </span>
            </Button>
          </div>
        </ShowcaseSubsection>
      </ShowcaseSection>

      <SidePanel
        isOpen={isLeftPanelOpen}
        onClose={handleCloseLeft}
        position='left'
        size='md'
      >
        <SidePanelHeader>
          <SidePanelTitle icon={<SettingsIcon />}>Settings</SidePanelTitle>
        </SidePanelHeader>
        <SidePanelBody>
          <p>This is a left-positioned side panel with medium size.</p>
          <p>
            It includes a header with an icon, a scrollable body, and a footer
            with actions.
          </p>
          <p>Press Escape or click the overlay to close.</p>
        </SidePanelBody>
        <SidePanelFooter>
          <Button
            icon={<MenuCloseIcon size={ICON_SIZE_MD} />}
            onClick={handleCloseLeft}
            size='sm'
          >
            Close
          </Button>
        </SidePanelFooter>
      </SidePanel>

      <SidePanel
        isOpen={isRightPanelOpen}
        onClose={handleCloseRight}
        position='right'
        size='lg'
      >
        <SidePanelHeader>
          <SidePanelTitle icon={<InfoIcon />}>Information</SidePanelTitle>
        </SidePanelHeader>
        <SidePanelBody>
          <Card elevation='sm'>
            <CardBody>
              <CardTitle icon={<SuccessIcon />}>Composable Design</CardTitle>
              <CardDescription>
                Side panels work great with other components like cards!
              </CardDescription>
            </CardBody>
          </Card>
          <div {...stylex.props(styles.panelContent)}>
            <p>This right panel is larger (lg size).</p>
            <p>You can put any content here, including other components.</p>
          </div>
        </SidePanelBody>
        <SidePanelFooter>
          <div {...stylex.props(styles.buttonRow)}>
            <Button onClick={handleCloseRight} size='sm'>
              Confirm
            </Button>
            <Button onClick={handleCloseRight} size='sm' variant='ghost'>
              Cancel
            </Button>
          </div>
        </SidePanelFooter>
      </SidePanel>
    </>
  );
};
