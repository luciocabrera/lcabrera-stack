import { describe, expect, it } from 'vite-plus/test';

import type { CarSaleRow } from './carSales.types';

import { toCarSaleRow } from './toCarSaleRow.util';

const driverRow = {
  buyer_address: 'Buyer Avenue 2',
  buyer_email: 'buyer1@example.com',
  buyer_name: 'Buyer 1',
  buyer_phone: '+1-666-0001',
  car_id: 1,
  city: 'City 2',
  color: 'White',
  country: 'Country 2',
  date_of_ingress: new Date('2020-01-01T23:00:00.000Z'),
  date_of_sale: new Date('2020-01-03T23:00:00.000Z'),
  engine: 'V6',
  fuel_type: 'Diesel',
  insurance_expiration_date: new Date('2025-01-01T23:00:00.000Z'),
  insurance_policy_number: 'POL0000000001',
  insurance_provider: 'InsuranceCo 2',
  // `numeric` arrives from the driver as a string, and JSON kept it a string —
  // the declared `number` on `CarSale` has always been aspirational here.
  loan_amount: '5001.00',
  loan_provider: 'LoanBank 2',
  mileage: 37,
  model: 'Model 2',
  postal_code: '00001',
  profit: '2000.00',
  purchase_price: '15001.00',
  sale_price: '17001.00',
  seller_address: 'Seller Street 2',
  seller_email: 'seller1@example.com',
  seller_name: 'Seller 1',
  seller_phone: '+1-555-0001',
  state: 'State 2',
  transmission: 'Manual',
  year: 2001,
} as unknown as CarSaleRow;

describe('toCarSaleRow', () => {
  it('renders every date column as the ISO string JSON would have produced', () => {
    const row = toCarSaleRow(driverRow);

    expect(row.date_of_ingress).toBe('2020-01-01T23:00:00.000Z');
    expect(row.date_of_sale).toBe('2020-01-03T23:00:00.000Z');
    expect(row.insurance_expiration_date).toBe('2025-01-01T23:00:00.000Z');
  });

  it('matches what `Response.json` does to the same row', async () => {
    // The load-more page goes through `Response.json` — literally the call
    // below, in the resource route's loader. The SSR page goes through this
    // function instead, and the two have to produce the same shape. This is the
    // only assertion that compares them directly.
    const throughJson = (await Response.json(driverRow).json()) as unknown;

    expect(toCarSaleRow(driverRow)).toStrictEqual(throughJson);
  });

  it('leaves every other column untouched, including numeric-as-string', () => {
    const row = toCarSaleRow(driverRow);

    expect(row.car_id).toBe(1);
    expect(row.model).toBe('Model 2');
    expect(row.profit).toBe('2000.00');
    expect(row.postal_code).toBe('00001');
  });

  it('does not mutate the row it was given', () => {
    toCarSaleRow(driverRow);

    expect(driverRow.date_of_sale).toBeInstanceOf(Date);
  });
});
