import { Button } from '@lcabrera/ui/components/Button';
import * as stylex from '@stylexjs/stylex';

import { styles } from '../ShowcasePage.stylex';
import { ShowcaseSection } from '../ShowcaseSection';
import { ShowcaseSubsection } from '../ShowcaseSubsection';

export const ButtonsSection = () => (
  <ShowcaseSection title='Buttons'>
    <ShowcaseSubsection title='Variants'>
      <div {...stylex.props(styles.buttonGrid)}>
        <Button variant='primary'>Primary</Button>
        <Button variant='secondary'>Secondary</Button>
        <Button variant='success'>Success</Button>
        <Button variant='warning'>Warning</Button>
        <Button variant='error'>Error</Button>
        <Button variant='ghost'>Ghost</Button>
        <Button variant='outline'>Outline</Button>
      </div>
    </ShowcaseSubsection>

    <ShowcaseSubsection title='Sizes'>
      <div {...stylex.props(styles.buttonGrid)}>
        <Button size='sm'>Small</Button>
        <Button size='md'>Medium</Button>
        <Button size='lg'>Large</Button>
      </div>
    </ShowcaseSubsection>

    <ShowcaseSubsection title='States'>
      <div {...stylex.props(styles.buttonGrid)}>
        <Button>Normal</Button>
        <Button isDisabled>Disabled</Button>
        <Button>Full Width</Button>
      </div>
    </ShowcaseSubsection>
  </ShowcaseSection>
);
