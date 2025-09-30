export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  image?: string;
  addedAt: Date;
  updatedAt: Date;
}

export interface CartData {
  id: string;
  sessionId: string;
  userId?: number;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  lastUpdated: Date;
}

export interface AddToCartInput {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  productId: string;
  quantity: number;
}
