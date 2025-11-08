import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Order, OrderItem } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private orders: Order[] = [];

  constructor(private readonly productsService: ProductsService) {}

  findAll(): Order[] {
    this.logger.log(`Finding all orders. Total: ${this.orders.length}`);
    return this.orders;
  }

  findOne(id: string): Order {
    this.logger.log(`Finding order with id: ${id}`);
    const order = this.orders.find((o) => o.id === id);
    if (!order) {
      this.logger.warn(`Order with id ${id} not found`);
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return order;
  }

  findByUserId(userId: string): Order[] {
    this.logger.log(`Finding orders for user: ${userId}`);
    return this.orders.filter((o) => o.userId === userId);
  }

  create(createOrderDto: CreateOrderDto): Order {
    this.logger.log(`Creating new order for user: ${createOrderDto.userId}`);

    // Calculate order items with prices
    const orderItems: OrderItem[] = createOrderDto.items.map((item) => {
      const product = this.productsService.findOne(item.productId);
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      };
    });

    // Calculate total amount
    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const newOrder: Order = {
      id: uuidv4(),
      userId: createOrderDto.userId,
      items: orderItems,
      totalAmount,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.orders.push(newOrder);
    this.logger.log(`Order created successfully with id: ${newOrder.id}, total: $${totalAmount}`);
    return newOrder;
  }

  updateStatus(id: string, status: Order['status']): Order {
    this.logger.log(`Updating order ${id} status to: ${status}`);
    const orderIndex = this.orders.findIndex((o) => o.id === id);
    if (orderIndex === -1) {
      this.logger.warn(`Order with id ${id} not found for status update`);
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    this.orders[orderIndex] = {
      ...this.orders[orderIndex],
      status,
      updatedAt: new Date(),
    };
    this.logger.log(`Order ${id} status updated to ${status}`);
    return this.orders[orderIndex];
  }
}
