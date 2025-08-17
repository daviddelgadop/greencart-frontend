export interface CatalogEntry {
  category: {
    code: string;
    label: string;
  };
}

export interface Product {
  id: number;
  title: string;
  images: { id: number; image: string }[];
  company_name: string;
  eco_score?: string;  
  unit?: string;  
}

export interface BundleItem {
  product: Product;
  quantity: number;
  best_before_date: string | null;
}

export interface CartItem {
  id: number;
  title: string;
  image: string;
  price: number;
  quantity: number;
  dluo?: string | null;
  items: BundleItem[];
  producerName?: string;
  total_avoided_waste_kg : number;
  total_avoided_co2_kg : number;
}
