import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';

type CartResponse = {
  id: string;
  userId: string;
  items: Array<{
    productId: string;
    productName: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartsRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemsRepository: Repository<CartItem>,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
  ) {}

  private calculateTotalAmount(items: CartItem[]): number {
    return items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  }

  private async getOrCreateCartEntity(userId: string): Promise<Cart> {
    let cart = await this.cartsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'user'],
    });

    if (!cart) {
      const user = await this.usersService.findOne(userId);
      cart = this.cartsRepository.create({
        user,
        items: [],
        totalAmount: 0,
      });
      cart = await this.cartsRepository.save(cart);
    }

    cart.items = cart.items ?? [];
    return cart;
  }

  private mapCart(cart: Cart): CartResponse {
    return {
      id: cart.id,
      userId: cart.user.id,
      totalAmount: cart.totalAmount,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      items:
        cart.items?.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          price: item.unitPrice,
          quantity: item.quantity,
        })) ?? [],
    };
  }

  async getCart(userId: string): Promise<CartResponse> {
    const cart = await this.getOrCreateCartEntity(userId);
    return this.mapCart(cart);
  }

  async addItem(addToCartDto: AddToCartDto): Promise<CartResponse> {
    const product = await this.productsService.findOne(addToCartDto.productId);
    if (product.stock < addToCartDto.quantity) {
      throw new BadRequestException(`Insufficient stock for product ${product.name}`);
    }

    const cart = await this.getOrCreateCartEntity(addToCartDto.userId);
    cart.items = cart.items ?? [];
    const existingItem = cart.items?.find((item) => item.product.id === addToCartDto.productId);

    if (existingItem) {
      existingItem.quantity += addToCartDto.quantity;
      await this.cartItemsRepository.save(existingItem);
    } else {
      const newItem = this.cartItemsRepository.create({
        cart,
        product,
        quantity: addToCartDto.quantity,
        unitPrice: product.price,
      });
      await this.cartItemsRepository.save(newItem);
      cart.items.push(newItem);
    }

    cart.totalAmount = this.calculateTotalAmount(cart.items);
    await this.cartsRepository.save(cart);
    const fresh = await this.getOrCreateCartEntity(addToCartDto.userId);
    return this.mapCart(fresh);
  }

  async updateItemQuantity(
    userId: string,
    productId: string,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateCartEntity(userId);
    cart.items = cart.items ?? [];
    const item = cart.items.find((cartItem) => cartItem.product.id === productId);
    if (!item) {
      throw new NotFoundException(`Product ${productId} not found in cart`);
    }

    if (updateCartItemDto.quantity <= 0) {
      await this.cartItemsRepository.remove(item);
      cart.items = cart.items.filter((cartItem) => cartItem.id !== item.id);
    } else {
      const product = await this.productsService.findOne(productId);
      if (product.stock < updateCartItemDto.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.name}`);
      }
      item.quantity = updateCartItemDto.quantity;
      await this.cartItemsRepository.save(item);
    }

    cart.totalAmount = this.calculateTotalAmount(cart.items);
    await this.cartsRepository.save(cart);
    const fresh = await this.getOrCreateCartEntity(userId);
    return this.mapCart(fresh);
  }

  async removeItem(userId: string, productId: string): Promise<CartResponse> {
    const cart = await this.getOrCreateCartEntity(userId);
    cart.items = cart.items ?? [];
    const item = cart.items.find((cartItem) => cartItem.product.id === productId);
    if (!item) {
      throw new NotFoundException(`Product ${productId} not found in cart`);
    }
    await this.cartItemsRepository.remove(item);
    cart.items = cart.items.filter((cartItem) => cartItem.id !== item.id);
    cart.totalAmount = this.calculateTotalAmount(cart.items);
    await this.cartsRepository.save(cart);
    const fresh = await this.getOrCreateCartEntity(userId);
    return this.mapCart(fresh);
  }

  async clearCart(userId: string): Promise<CartResponse> {
    const cart = await this.getOrCreateCartEntity(userId);
    cart.items = cart.items ?? [];
    if (cart.items.length > 0) {
      await this.cartItemsRepository.remove(cart.items);
    }
    cart.items = [];
    cart.totalAmount = 0;
    await this.cartsRepository.save(cart);
    const fresh = await this.getOrCreateCartEntity(userId);
    return this.mapCart(fresh);
  }

  async removeCart(userId: string): Promise<void> {
    const cart = await this.cartsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items'],
    });
    if (cart) {
      cart.items = cart.items ?? [];
      await this.cartsRepository.remove(cart);
    }
  }
}
