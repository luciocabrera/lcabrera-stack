import { readOrderSample } from './oracle';

export default async function globalSetup() {
  const sample = await readOrderSample();

  if (sample.count === 0) {
    throw new Error(
      'enterprise_orders is empty. Seed the showcase database before running the browser suite.',
    );
  }
}
