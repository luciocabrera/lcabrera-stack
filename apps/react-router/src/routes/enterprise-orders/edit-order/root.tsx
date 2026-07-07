import { SectionCard } from '@repo/ui/components/SectionCard';
import { useParams } from 'react-router';

export const EditOrder = () => {
  const params = useParams();

  return (
    <SectionCard
      description='Edit flow for enterprise orders is not implemented yet.'
      title='Edit Order'
    >
      {`Edit order placeholder for #${params.orderId ?? 'unknown'}.`}
    </SectionCard>
  );
};
