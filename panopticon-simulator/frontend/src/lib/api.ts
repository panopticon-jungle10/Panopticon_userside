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
