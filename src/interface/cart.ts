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
  userId?: string;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  lastUpdated: Date;
}

export interface AddToCartInput {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  image?: string;
}

export interface UpdateCartItemInput {
  productId: string;
  quantity: number;
}
