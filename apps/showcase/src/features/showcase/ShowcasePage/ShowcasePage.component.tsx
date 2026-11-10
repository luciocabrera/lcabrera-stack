import { Button } from '@lcabrera/ui/components/Button';
import { Title } from '@lcabrera/ui/components/Title';
import { useTheme } from '@lcabrera/ui/hooks/useTheme.hook';
import * as stylex from '@stylexjs/stylex';

import { ButtonsSection } from './ButtonsSection';
import { CardsSection } from './CardsSection';
import { styles } from './ShowcasePage.stylex';
import { SidePanelSection } from './SidePanelSection';

export const ShowcasePage = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div {...stylex.props(styles.app)}>
      <div {...stylex.props(styles.container)}>
        <header {...stylex.props(styles.header)}>
          <Title level={1} variant='plain'>
            Design System Showcase
          </Title>
          <Button onClick={toggleTheme} variant='ghost'>
            {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </Button>
        </header>
        <ButtonsSection />
        <CardsSection />
        <SidePanelSection />
      </div>
    </div>
  );
};
