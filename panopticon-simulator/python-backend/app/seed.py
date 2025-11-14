from sqlalchemy.orm import Session

from .logger import get_logger
from .models import Product, User

logger = get_logger("seed")


def seed_data(db: Session, *, seed_products: bool = True, seed_users: bool = True) -> None:
    if seed_products and db.query(Product).count() == 0:
        products = [
            Product(
                name="Laptop",
                description="High-performance laptop",
                price=1200,
                stock=50,
                category="Electronics",
            ),
            Product(
                name="Wireless Mouse",
                description="Ergonomic wireless mouse",
                price=25,
                stock=200,
                category="Accessories",
            ),
            Product(
                name="Mechanical Keyboard",
                description="RGB mechanical keyboard",
                price=80,
                stock=100,
                category="Accessories",
            ),
        ]
        db.add_all(products)
        db.commit()
        logger.info("Seeded default products")

    if seed_users and db.query(User).count() == 0:
        users = [
            User(email="john@example.com", name="John Doe"),
            User(email="jane@example.com", name="Jane Smith"),
        ]
        db.add_all(users)
        db.commit()
        logger.info("Seeded default users")
