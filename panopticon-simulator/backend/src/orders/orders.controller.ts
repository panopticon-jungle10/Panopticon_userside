import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './order.entity';
import { StructuredLogger } from '../common/structured-logger.service';

@Controller('orders')
export class OrdersController {
  private readonly logger = new StructuredLogger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@Query('userId') userId?: string) {
    this.logger.log('GET /orders - Fetching all orders');
    if (userId) {
      this.logger.log(`Filtering by userId: ${userId}`);
      return this.ordersService.findByUserId(userId);
    }
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    this.logger.log(`GET /orders/${id} - Fetching order`);
    return this.ordersService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createOrderDto: CreateOrderDto) {
    this.logger.log('POST /orders - Creating new order');
    return this.ordersService.create(createOrderDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: Order['status'],
  ) {
    this.logger.log(`PATCH /orders/${id}/status - Updating order status`);
    return this.ordersService.updateStatus(id, status);
  }
}
