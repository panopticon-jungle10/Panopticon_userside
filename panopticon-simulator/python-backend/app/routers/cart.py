from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..logger import get_logger
from ..models import Cart, CartItem, Product, User
from ..schemas import AddToCartRequest, CartRead, CartItemRead, UpdateCartItemRequest

router = APIRouter(prefix="/cart", tags=["cart"])
logger = get_logger("cart")


def fetch_cart(db: Session, user_id: str) -> Cart:
    cart = (
        db.query(Cart)
        .options(joinedload(Cart.items).joinedload(CartItem.product))
        .filter(Cart.user_id == user_id)
        .first()
    )
    if not cart:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        cart = Cart(user=user, total_amount=0, items=[])
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


def serialize_cart(cart: Cart) -> CartRead:
    return CartRead(
        id=cart.id,
        userId=cart.user_id,
        totalAmount=cart.total_amount,
        createdAt=cart.created_at,
        updatedAt=cart.updated_at,
        items=[
            CartItemRead(
                productId=item.product_id,
                productName=item.product.name if item.product else "",
                price=item.unit_price,
                quantity=item.quantity,
            )
            for item in cart.items
        ],
    )


def recalc_total(cart: Cart) -> None:
    cart.total_amount = sum(item.unit_price * item.quantity for item in cart.items)


@router.get("/{user_id}", response_model=CartRead)
def get_cart(user_id: str, db: Session = Depends(get_db)):
    cart = fetch_cart(db, user_id)
    return serialize_cart(cart)


@router.post("/items", response_model=CartRead, status_code=status.HTTP_201_CREATED)
def add_item(payload: AddToCartRequest, db: Session = Depends(get_db)):
    cart = fetch_cart(db, payload.userId)
    product = db.query(Product).filter(Product.id == payload.productId).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if product.stock < payload.quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock")
    existing = next((item for item in cart.items if item.product_id == payload.productId), None)
    if existing:
        existing.quantity += payload.quantity
    else:
        new_item = CartItem(cart=cart, product=product, quantity=payload.quantity, unit_price=product.price)
        cart.items.append(new_item)
        db.add(new_item)
    recalc_total(cart)
    db.commit()
    db.refresh(cart)
    logger.info("cart add item", user=payload.userId, product=payload.productId)
    return serialize_cart(cart)


@router.put("/{user_id}/items/{product_id}", response_model=CartRead)
def update_item(user_id: str, product_id: str, payload: UpdateCartItemRequest, db: Session = Depends(get_db)):
    cart = fetch_cart(db, user_id)
    item = next((entry for entry in cart.items if entry.product_id == product_id), None)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not in cart")
    if payload.quantity <= 0:
        cart.items.remove(item)
        db.delete(item)
    else:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product or product.stock < payload.quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock")
        item.quantity = payload.quantity
    recalc_total(cart)
    db.commit()
    db.refresh(cart)
    return serialize_cart(cart)


@router.delete("/{user_id}/items/{product_id}", response_model=CartRead)
def remove_item(user_id: str, product_id: str, db: Session = Depends(get_db)):
    cart = fetch_cart(db, user_id)
    item = next((entry for entry in cart.items if entry.product_id == product_id), None)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not in cart")
    cart.items.remove(item)
    db.delete(item)
    recalc_total(cart)
    db.commit()
    db.refresh(cart)
    return serialize_cart(cart)


@router.delete("/{user_id}", response_model=CartRead)
def clear_cart(user_id: str, db: Session = Depends(get_db)):
    cart = fetch_cart(db, user_id)
    for item in list(cart.items):
        db.delete(item)
    cart.items.clear()
    cart.total_amount = 0
    db.commit()
    db.refresh(cart)
    return serialize_cart(cart)
