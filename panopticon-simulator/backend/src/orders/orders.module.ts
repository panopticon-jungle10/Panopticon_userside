import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ProductsModule } from '../products/products.module';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem]), ProductsModule, UsersModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
