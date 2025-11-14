from __future__ import annotations

from datetime import datetime
from typing import List
from uuid import uuid4

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
        name="createdAt",
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=True,
        name="updatedAt",
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
        name="createdAt",
    )

    orders: Mapped[List["Order"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    carts: Mapped[List["Cart"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)

    order_items: Mapped[List["OrderItem"]] = relationship(back_populates="product")
    cart_items: Mapped[List["CartItem"]] = relationship(back_populates="product")


class Order(Base, TimestampMixin):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, name="userId")
    total_amount: Mapped[int] = mapped_column(Integer, nullable=False, name="totalAmount")
    status: Mapped[str] = mapped_column(
        Enum("pending", "processing", "completed", "cancelled", name="order_status"),
        default="pending",
        nullable=False,
    )

    user: Mapped[User] = relationship(back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    order_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("orders.id", ondelete="CASCADE"), name="orderId")
    product_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("products.id"), name="productId")
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[int] = mapped_column(Integer, nullable=False, name="unitPrice")

    order: Mapped[Order] = relationship(back_populates="items")
    product: Mapped[Product] = relationship(back_populates="order_items")


class Cart(Base, TimestampMixin):
    __tablename__ = "carts"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"), name="userId")
    total_amount: Mapped[int] = mapped_column(Integer, default=0, nullable=False, name="totalAmount")

    user: Mapped[User] = relationship(back_populates="carts")
    items: Mapped[List["CartItem"]] = relationship(
        back_populates="cart",
        cascade="all, delete-orphan",
    )

class CartItem(Base):
    __tablename__ = "cart_items"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    cart_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("carts.id", ondelete="CASCADE"), name="cartId")
    product_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("products.id"), name="productId")
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[int] = mapped_column(Integer, nullable=False, name="unitPrice")

    cart: Mapped[Cart] = relationship(back_populates="items")
    product: Mapped[Product] = relationship(back_populates="cart_items")
