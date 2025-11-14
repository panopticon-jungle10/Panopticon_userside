"""
Locust load testing script for E-commerce Backend

This simulates realistic user behavior:
1. Login
2. Browse products
3. Add items to cart
4. Checkout (sometimes fails intentionally for demo)

Usage:
    locust -f locustfile.py --host=http://localhost:3000

    Then open: http://localhost:8089
"""

import random
from locust import HttpUser, task, between
import json


class EcommerceUser(HttpUser):
    """
    Simulates a real e-commerce user browsing and shopping
    """

    # Wait 1-3 seconds between requests (like a real user)
    wait_time = between(1, 3)

    # Store user context
    user_id = None
    product_ids = []
    cart_id = None

    def on_start(self):
        """
        Called when a user starts - simulates login
        """
        # Login
        response = self.client.post("/users/login", json={
            "email": f"user{random.randint(1, 1000)}@example.com",
            "name": f"Test User {random.randint(1, 1000)}"
        })

        if response.status_code == 200 or response.status_code == 201:
            data = response.json()
            self.user_id = data.get("id")
            print(f"✅ User logged in: {self.user_id}")

        # Get available products
        response = self.client.get("/products")
        if response.status_code == 200:
            products = response.json()
            self.product_ids = [p["id"] for p in products[:5]]  # Store first 5 products
            print(f"📦 Found {len(self.product_ids)} products")

    @task(5)
    def browse_products(self):
        """
        Browse product catalog - most common action (weight: 5)
        """
        self.client.get("/products", name="GET /products")

    @task(3)
    def view_product_detail(self):
        """
        View a specific product detail (weight: 3)
        """
        if self.product_ids:
            product_id = random.choice(self.product_ids)
            self.client.get(f"/products/{product_id}", name="GET /products/:id")

    @task(4)
    def add_to_cart(self):
        """
        Add item to cart (weight: 4)
        """
        if not self.user_id or not self.product_ids:
            return

        product_id = random.choice(self.product_ids)
        response = self.client.post("/cart/items", json={
            "userId": self.user_id,
            "productId": product_id,
            "quantity": random.randint(1, 3)
        }, name="POST /cart/items")

        if response.status_code in [200, 201]:
            print(f"🛒 Added product {product_id} to cart")

    @task(2)
    def view_cart(self):
        """
        View cart contents (weight: 2)
        """
        if not self.user_id:
            return

        self.client.get(f"/cart/{self.user_id}", name="GET /cart/:userId")

    @task(1)
    def checkout(self):
        """
        Attempt checkout - least frequent but most important (weight: 1)
        Some checkouts will intentionally fail to create error scenarios
        """
        if not self.user_id or not self.product_ids:
            return

        # Create order
        items = [
            {
                "productId": random.choice(self.product_ids),
                "quantity": random.randint(1, 2)
            }
            for _ in range(random.randint(1, 3))
        ]

        response = self.client.post("/orders", json={
            "userId": self.user_id,
            "items": items
        }, name="POST /orders")

        if response.status_code in [200, 201]:
            order_data = response.json()
            print(f"✅ Order created: {order_data.get('id')}")
        else:
            print(f"❌ Order failed: {response.status_code}")

    @task(1)
    def check_order_history(self):
        """
        Check order history (weight: 1)
        """
        if not self.user_id:
            return

        self.client.get(f"/orders/user/{self.user_id}", name="GET /orders/user/:userId")


class HeavyShopperUser(HttpUser):
    """
    Simulates a heavy shopper who adds many items quickly
    This creates more DB load and spans
    """

    wait_time = between(0.5, 1.5)  # Faster than normal users

    user_id = None
    product_ids = []

    def on_start(self):
        # Quick login
        response = self.client.post("/users/login", json={
            "email": f"heavy{random.randint(1, 100)}@example.com",
            "name": f"Heavy User {random.randint(1, 100)}"
        })

        if response.status_code in [200, 201]:
            data = response.json()
            self.user_id = data.get("id")

        # Get products
        response = self.client.get("/products")
        if response.status_code == 200:
            products = response.json()
            self.product_ids = [p["id"] for p in products]

    @task(10)
    def rapid_add_to_cart(self):
        """
        Rapidly add items to cart - creates heavy load
        """
        if not self.user_id or not self.product_ids:
            return

        for _ in range(random.randint(1, 3)):
            product_id = random.choice(self.product_ids)
            self.client.post("/cart/items", json={
                "userId": self.user_id,
                "productId": product_id,
                "quantity": random.randint(1, 5)
            }, name="POST /cart/items (rapid)")

    @task(3)
    def bulk_checkout(self):
        """
        Checkout with many items
        """
        if not self.user_id or not self.product_ids:
            return

        items = [
            {
                "productId": random.choice(self.product_ids),
                "quantity": random.randint(1, 3)
            }
            for _ in range(random.randint(3, 6))  # More items than normal user
        ]

        self.client.post("/orders", json={
            "userId": self.user_id,
            "items": items
        }, name="POST /orders (bulk)")


# Test configuration
# You can adjust these when running:
# locust -f locustfile.py --users=50 --spawn-rate=5 --host=http://localhost:3000
