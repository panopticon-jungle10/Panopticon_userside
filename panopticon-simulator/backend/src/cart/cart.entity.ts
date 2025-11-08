export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  productName: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}
