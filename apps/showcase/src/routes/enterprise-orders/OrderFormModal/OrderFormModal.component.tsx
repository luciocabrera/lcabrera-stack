import { Form } from '@lcabrera/ui/components/Form';
import { Modal } from '@lcabrera/ui/components/Modal';
import { useNavigate } from 'react-router';

import type { EnterpriseOrderValues } from '../config';
import type { OrderFormModalProps } from './OrderFormModal.types';

import { ENTERPRISE_ORDERS_PATH } from '../config';
import { buildOrderFormFields } from '../utils/orderFormFields.util';
import { styles } from './OrderFormModal.stylex';

export const OrderFormModal = ({
  initialValues,
  mode,
  serverErrors,
  submitLabel,
  title,
}: OrderFormModalProps) => {
  const navigate = useNavigate();

  const handleClose = () => {
    void navigate(ENTERPRISE_ORDERS_PATH);
  };

  return (
    <Modal
      bodyStylex={styles.flushBody}
      customStylex={styles.dialog}
      isOpen
      onClose={handleClose}
      title={title}
    >
      <Form<EnterpriseOrderValues>
        cancelTo={ENTERPRISE_ORDERS_PATH}
        fields={buildOrderFormFields({ mode })}
        initialValues={initialValues}
        method='post'
        mode={mode}
        serverErrors={serverErrors}
        submitLabel={submitLabel}
      />
    </Modal>
  );
};
