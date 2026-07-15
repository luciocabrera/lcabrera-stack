import { Button } from '@repo/ui/components/Button';
import { CheckIcon, CopyIcon } from '@repo/ui/components/Icons';
import { useState } from 'react';

import type { CopyButtonProps } from './CopyButton.types';

const CONFIRMATION_DURATION_MS = 1500;

export const CopyButton = ({ label = 'Copy', value }: CopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleClick = () => {
    void navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), CONFIRMATION_DURATION_MS);
    });
  };

  return (
    <Button
      aria-label={isCopied ? 'Copied' : label}
      icon={isCopied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
      isIconOnly
      onClick={handleClick}
      size='sm'
      tooltipContent={isCopied ? 'Copied!' : label}
      variant='ghost'
    />
  );
};
