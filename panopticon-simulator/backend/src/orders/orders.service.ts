import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { StructuredLogger } from '../common/structured-logger.service';

@Injectable()
export class OrdersService {
  private readonly logger = new StructuredLogger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
  ) {}

  findAll(): Promise<Order[]> {
    this.logger.log('Finding all orders');
    return this.ordersRepository.find({
      relations: ['items', 'items.product', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    this.logger.log(`Finding order with id: ${id}`);
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'user'],
    });
    if (!order) {
      this.logger.warn(`Order with id ${id} not found`);
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return order;
  }

  findByUserId(userId: string): Promise<Order[]> {
    this.logger.log(`Finding orders for user: ${userId}`);
    return this.ordersRepository.find({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    this.logger.log(`Creating new order for user: ${createOrderDto.userId}`);
    const user = await this.usersService.findOne(createOrderDto.userId);

    const items: OrderItem[] = [];
    for (const item of createOrderDto.items) {
      const product = await this.productsService.findOne(item.productId);
      const orderItem = new OrderItem();
      orderItem.product = product;
      orderItem.quantity = item.quantity;
      orderItem.unitPrice = product.price;
      items.push(orderItem);
    }

    const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const order = this.ordersRepository.create({
      user,
      items,
      totalAmount,
      status: 'pending',
    });
    const saved = await this.ordersRepository.save(order);
    this.logger.log(`Order created successfully with id: ${saved.id}, total: $${totalAmount}`);
    return saved;
  }

  async updateStatus(id: string, status: Order['status']): Promise<Order> {
    this.logger.log(`Updating order ${id} status to: ${status}`);
    const order = await this.findOne(id);
    order.status = status;
    const updated = await this.ordersRepository.save(order);
    this.logger.log(`Order ${id} status updated to ${status}`);
    return updated;
  }
}
