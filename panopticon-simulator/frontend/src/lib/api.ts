const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

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
  createdAt: string;
  updatedAt: string;
}

// Products API
export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/products`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function getProduct(id: string): Promise<Product> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

// Users API
export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${API_URL}/users`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function createUser(email: string, name: string): Promise<User> {
  const res = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, name }),
  });
  if (!res.ok) throw new Error('Failed to create user');
  return res.json();
}

// Orders API
export async function createOrder(userId: string, items: OrderItem[]): Promise<Order> {
  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, items }),
  });
  if (!res.ok) throw new Error('Failed to create order');
  return res.json();
}

export async function getOrders(userId?: string): Promise<Order[]> {
  const url = userId ? `${API_URL}/orders?userId=${userId}` : `${API_URL}/orders`;
  const res = await fetch(url, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

// Cart API
export async function getCart(userId: string): Promise<Cart> {
  const res = await fetch(`${API_URL}/cart/${userId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch cart');
  return res.json();
}

export async function addToCart(userId: string, productId: string, quantity: number): Promise<Cart> {
  const res = await fetch(`${API_URL}/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, productId, quantity }),
  });
  if (!res.ok) throw new Error('Failed to add item to cart');
  return res.json();
}

export async function updateCartItemQuantity(userId: string, productId: string, quantity: number): Promise<Cart> {
  const res = await fetch(`${API_URL}/cart/${userId}/items/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error('Failed to update cart item');
  return res.json();
}

export async function removeFromCart(userId: string, productId: string): Promise<Cart> {
  const res = await fetch(`${API_URL}/cart/${userId}/items/${productId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to remove item from cart');
  return res.json();
}

export async function clearCart(userId: string): Promise<Cart> {
  const res = await fetch(`${API_URL}/cart/${userId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to clear cart');
  return res.json();
}
