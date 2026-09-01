import { createHmac } from 'node:crypto';

type SignAuthPayloadArgs = {
  readonly payload: string;
  readonly secret: string;
};

export const signAuthPayload = ({ payload, secret }: SignAuthPayloadArgs) =>
  createHmac('sha256', secret).update(payload).digest('hex');
