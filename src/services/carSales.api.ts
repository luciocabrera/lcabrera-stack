/**
 * Car Sales API Service
 * Handles database queries for car sales data
 */

/**
 * Simulated API delay in milliseconds for testing loading states.
 * Set to 0 for production or to disable delay.
 */
const FAKE_API_DELAY_MS = 3000;

/**
 * Helper to add artificial delay for testing loading states
 */
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export type CarSale = {
  buyer_address: string;
  buyer_email: string;
  buyer_name: string;
  buyer_phone: string;
  car_id: number;
  city: null | string;
  color: string;
  country: null | string;
  date_of_ingress: string;
  date_of_sale: string;
  engine: string;
  fuel_type: string;
  insurance_expiration_date: string;
  insurance_policy_number: string;
  insurance_provider: string;
  loan_amount: number;
  loan_provider: string;
  mileage: number;
  model: string;
  postal_code: null | string;
  profit: number;
  purchase_price: number;
  sale_price: number;
  seller_address: string;
  seller_email: string;
  seller_name: string;
  seller_phone: string;
  state: null | string;
  transmission: string;
  year: number;
};

export type CarSalesResponse = {
  data: CarSale[];
  total: number;
};

const API_BASE_URL = 'http://localhost:3001/api';

export const carSalesApi = {
  /**
   * Fetch car sales data
   */
  fetchCarSales: async (): Promise<CarSalesResponse> => {
    // Add fake delay for testing skeleton/loading states
    if (FAKE_API_DELAY_MS > 0) {
      await delay(FAKE_API_DELAY_MS);
    }

    const response = await fetch(`${API_BASE_URL}/car-sales`);

    if (!response.ok) {
      throw new Error(`Failed to fetch car sales: ${response.statusText}`);
    }

    const data = (await response.json()) as CarSalesResponse;
    return data;
  },
};
