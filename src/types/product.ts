// src/types/product.ts
export type ProductType = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  imageUrl: string[];
  isActive: boolean;
  inventory: number;
  sku?: string;
  createdAt: Date;
  updatedAt: Date;
};
