from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..logger import get_logger
from ..models import Product
from ..schemas import ProductCreate, ProductRead, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])
logger = get_logger("products")


@router.get("", response_model=list[ProductRead])
@router.get("/", response_model=list[ProductRead])
def list_products(category: str | None = Query(default=None), db: Session = Depends(get_db)):
    query = db.query(Product)
    if category:
        logger.info("filtering products", category=category)
        query = query.filter(Product.category == category)
    products = query.all()
    logger.info("listing products", count=len(products))
    return products


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        logger.warning("product not found", product_id=product_id)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.post("/", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    logger.info("created product", product_id=product.id)
    return product


@router.put("/{product_id}", response_model=ProductRead)
def update_product(product_id: str, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    logger.info("updated product", product_id=product.id)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    db.delete(product)
    db.commit()
    logger.info("deleted product", product_id=product.id)
