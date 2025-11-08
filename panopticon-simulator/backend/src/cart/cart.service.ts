import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Cart, CartItem } from './cart.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  private carts: Cart[] = [];

  constructor(private readonly productsService: ProductsService) {}

  private calculateTotalAmount(items: CartItem[]): number {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  findByUserId(userId: string): Cart {
    this.logger.log(`Finding cart for user: ${userId}`);
    let cart = this.carts.find((c) => c.userId === userId);

    if (!cart) {
      this.logger.log(`Creating new cart for user: ${userId}`);
      cart = {
        id: uuidv4(),
        userId,
        items: [],
        totalAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.carts.push(cart);
    }

    return cart;
  }

  addItem(addToCartDto: AddToCartDto): Cart {
    this.logger.log(`Adding item to cart for user: ${addToCartDto.userId}`);

    // Validate product exists and has stock
    const product = this.productsService.findOne(addToCartDto.productId);
    if (product.stock < addToCartDto.quantity) {
      throw new BadRequestException(`Insufficient stock for product ${product.name}`);
    }

    const cart = this.findByUserId(addToCartDto.userId);
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === addToCartDto.productId,
    );

    if (existingItemIndex !== -1) {
      // Update quantity if item already exists
      cart.items[existingItemIndex].quantity += addToCartDto.quantity;
      this.logger.log(`Updated quantity for existing item in cart`);
    } else {
      // Add new item to cart
      const newItem: CartItem = {
        productId: addToCartDto.productId,
        quantity: addToCartDto.quantity,
        price: product.price,
        productName: product.name,
      };
      cart.items.push(newItem);
      this.logger.log(`Added new item to cart: ${product.name}`);
    }

    cart.totalAmount = this.calculateTotalAmount(cart.items);
    cart.updatedAt = new Date();

    return cart;
  }

  updateItemQuantity(
    userId: string,
    productId: string,
    updateCartItemDto: UpdateCartItemDto,
  ): Cart {
    this.logger.log(`Updating cart item quantity for user: ${userId}, product: ${productId}`);

    const cart = this.findByUserId(userId);
    const itemIndex = cart.items.findIndex((item) => item.productId === productId);

    if (itemIndex === -1) {
      throw new NotFoundException(`Product ${productId} not found in cart`);
    }

    if (updateCartItemDto.quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.items.splice(itemIndex, 1);
      this.logger.log(`Removed item from cart`);
    } else {
      // Validate stock
      const product = this.productsService.findOne(productId);
      if (product.stock < updateCartItemDto.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.name}`);
      }

      cart.items[itemIndex].quantity = updateCartItemDto.quantity;
      this.logger.log(`Updated item quantity to ${updateCartItemDto.quantity}`);
    }

    cart.totalAmount = this.calculateTotalAmount(cart.items);
    cart.updatedAt = new Date();

    return cart;
  }

  removeItem(userId: string, productId: string): Cart {
    this.logger.log(`Removing item from cart for user: ${userId}, product: ${productId}`);

    const cart = this.findByUserId(userId);
    const itemIndex = cart.items.findIndex((item) => item.productId === productId);

    if (itemIndex === -1) {
      throw new NotFoundException(`Product ${productId} not found in cart`);
    }

    cart.items.splice(itemIndex, 1);
    cart.totalAmount = this.calculateTotalAmount(cart.items);
    cart.updatedAt = new Date();

    this.logger.log(`Item removed from cart successfully`);
    return cart;
  }

  clearCart(userId: string): Cart {
    this.logger.log(`Clearing cart for user: ${userId}`);

    const cart = this.findByUserId(userId);
    cart.items = [];
    cart.totalAmount = 0;
    cart.updatedAt = new Date();

    this.logger.log(`Cart cleared successfully`);
    return cart;
  }

  removeCart(userId: string): void {
    this.logger.log(`Removing cart for user: ${userId}`);

    const cartIndex = this.carts.findIndex((c) => c.userId === userId);
    if (cartIndex !== -1) {
      this.carts.splice(cartIndex, 1);
      this.logger.log(`Cart removed successfully`);
    }
  }
}
