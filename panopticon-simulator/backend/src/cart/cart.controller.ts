import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':userId')
  getCart(@Param('userId') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  addItem(@Body() addToCartDto: AddToCartDto) {
    return this.cartService.addItem(addToCartDto);
  }

  @Put(':userId/items/:productId')
  updateItemQuantity(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQuantity(userId, productId, updateCartItemDto);
  }

  @Delete(':userId/items/:productId')
  @HttpCode(HttpStatus.OK)
  removeItem(@Param('userId') userId: string, @Param('productId') productId: string) {
    return this.cartService.removeItem(userId, productId);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.OK)
  clearCart(@Param('userId') userId: string) {
    return this.cartService.clearCart(userId);
  }
}
