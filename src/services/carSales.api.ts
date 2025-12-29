/**
 * Car Sales API Service
 * Handles database queries for car sales data
 */

export type CarSale = {
  buyer_address: string;
  buyer_email: string;
  buyer_name: string;
  buyer_phone: string;
  car_id: number;
  city: string | null;
  color: string;
  country: string | null;
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
  postal_code: string | null;
  profit: number;
  purchase_price: number;
  sale_price: number;
  seller_address: string;
  seller_email: string;
  seller_name: string;
  seller_phone: string;
  state: string | null;
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
    const response = await fetch(`${API_BASE_URL}/car-sales`);

    if (!response.ok) {
      throw new Error(`Failed to fetch car sales: ${response.statusText}`);
    }

    return response.json();
  },
};
