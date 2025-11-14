from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..logger import get_logger
from ..models import Order, OrderItem, Product, User
from ..schemas import OrderCreate, OrderRead

router = APIRouter(prefix="/orders", tags=["orders"])
logger = get_logger("orders")


def serialize_order(order: Order) -> dict:
    return {
        "id": order.id,
        "userId": order.user_id,
        "totalAmount": order.total_amount,
        "status": order.status,
        "createdAt": order.created_at,
        "updatedAt": order.updated_at,
        "items": [
            {
                "id": item.id,
                "productId": item.product_id,
                "productName": item.product.name if item.product else "",
                "quantity": item.quantity,
                "unitPrice": item.unit_price,
            }
            for item in order.items
        ],
    }


@router.get("/", response_model=list[OrderRead])
def list_orders(userId: str | None = Query(default=None), db: Session = Depends(get_db)):
    query = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .order_by(Order.created_at.desc())
    )
    if userId:
        query = query.filter(Order.user_id == userId)
    orders = query.all()
    return [serialize_order(order) for order in orders]


@router.get("/{order_id}", response_model=OrderRead)
def get_order(order_id: str, db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return serialize_order(order)


@router.post("/", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.userId).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not payload.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order items required")

    order_items: list[OrderItem] = []
    total = 0
    for item in payload.items:
        product = db.query(Product).filter(Product.id == item.productId).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product {item.productId} not found")
        order_item = OrderItem(product=product, quantity=item.quantity, unit_price=product.price)
        total += order_item.quantity * order_item.unit_price
        order_items.append(order_item)

    order = Order(user=user, items=order_items, total_amount=total, status="pending")
    db.add(order)
    db.commit()
    db.refresh(order)
    logger.info("created order", order_id=order.id, total=total)
    return serialize_order(order)


@router.patch("/{order_id}/status", response_model=OrderRead)
def update_status(order_id: str, status_value: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    order.status = status_value
    db.commit()
    db.refresh(order)
    logger.info("updated order status", order_id=order.id, status=status_value)
    return serialize_order(order)
