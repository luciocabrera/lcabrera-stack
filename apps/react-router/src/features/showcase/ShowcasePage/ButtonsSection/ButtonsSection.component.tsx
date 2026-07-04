import * as stylex from '@stylexjs/stylex';

import { Button } from '@repo/ui/components/Button';

import { styles } from '../ShowcasePage.stylex';
import { ShowcaseSection } from '../ShowcaseSection';
import { ShowcaseSubsection } from '../ShowcaseSubsection';

export const ButtonsSection = () => (
  <ShowcaseSection title='Buttons'>
    <ShowcaseSubsection title='Colors'>
      <div {...stylex.props(styles.buttonGrid)}>
        <Button color='primary'>Primary</Button>
        <Button color='secondary'>Secondary</Button>
        <Button color='success'>Success</Button>
        <Button color='warning'>Warning</Button>
        <Button color='error'>Error</Button>
        <Button color='ghost'>Ghost</Button>
        <Button color='outline'>Outline</Button>
      </div>
    </ShowcaseSubsection>

    <ShowcaseSubsection title='Sizes'>
      <div {...stylex.props(styles.buttonGrid)}>
        <Button size='sm'>Small</Button>
        <Button size='md'>Medium</Button>
        <Button size='lg'>Large</Button>
      </div>
    </ShowcaseSubsection>

    <ShowcaseSubsection title='Variants'>
      <div {...stylex.props(styles.buttonGrid)}>
        <Button variant='solid'>Solid</Button>
        <Button variant='flat'>Flat</Button>
        <Button variant='elevated'>Elevated</Button>
      </div>
    </ShowcaseSubsection>

    <ShowcaseSubsection title='States'>
      <div {...stylex.props(styles.buttonGrid)}>
        <Button>Normal</Button>
        <Button isDisabled>Disabled</Button>
        <Button width='full'>Full Width</Button>
      </div>
    </ShowcaseSubsection>
  </ShowcaseSection>
);
