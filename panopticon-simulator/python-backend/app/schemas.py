from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class ProductBase(BaseModel):
    name: str
    description: str
    price: int
    stock: int
    category: str


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[int] = None
    stock: Optional[int] = None
    category: Optional[str] = None


class ProductRead(ProductBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID | str
    created_at: datetime = Field(alias="createdAt")
    updated_at: Optional[datetime] = Field(alias="updatedAt", default=None)


class UserBase(BaseModel):
    email: str
    name: str


class UserCreate(UserBase):
    pass


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID | str
    created_at: datetime = Field(alias="createdAt")


class UserLoginRequest(BaseModel):
    email: str
    name: Optional[str] = None


class OrderItemRequest(BaseModel):
    productId: str
    quantity: int


class OrderCreate(BaseModel):
    userId: str
    items: List[OrderItemRequest]


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID | str
    productId: str = Field(alias="product_id")
    productName: str = Field(alias="product_name")
    quantity: int
    unitPrice: int = Field(alias="unit_price")


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID | str
    userId: str = Field(alias="user_id")
    totalAmount: int = Field(alias="total_amount")
    status: str
    createdAt: datetime
    updatedAt: datetime
    items: List[OrderItemRead]


class AddToCartRequest(BaseModel):
    userId: str
    productId: str
    quantity: int


class UpdateCartItemRequest(BaseModel):
    quantity: int


class CartItemRead(BaseModel):
    productId: str
    productName: str
    price: int
    quantity: int


class CartRead(BaseModel):
    id: UUID | str
    userId: str
    totalAmount: int
    createdAt: datetime
    updatedAt: datetime
    items: List[CartItemRead]
