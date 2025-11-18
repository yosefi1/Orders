export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  image_url?: string | null;
  has_addons: boolean;
  has_variations: boolean;
  addons: string[] | null;
  variations: string[] | null;
}

