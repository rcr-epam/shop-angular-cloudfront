export interface Product {
  count: number;
  description: string;
  id: string;
  price: number;
  title: string;
}

export interface Stock {
  product_id: string;
  count: number;
}
