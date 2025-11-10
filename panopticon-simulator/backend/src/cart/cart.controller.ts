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
import { StructuredLogger } from '../common/structured-logger.service';

@Controller('cart')
export class CartController {
  private readonly logger = new StructuredLogger(CartController.name);

  constructor(private readonly cartService: CartService) {}

  @Get(':userId')
  getCart(@Param('userId') userId: string) {
    this.logger.log(`GET /cart/${userId} - Fetching cart`);
    return this.cartService.getCart(userId);
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  addItem(@Body() addToCartDto: AddToCartDto) {
    this.logger.log(`POST /cart/items - Adding item to cart`);
    return this.cartService.addItem(addToCartDto);
  }

  @Put(':userId/items/:productId')
  updateItemQuantity(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    this.logger.log(`PUT /cart/${userId}/items/${productId} - Updating item quantity`);
    return this.cartService.updateItemQuantity(userId, productId, updateCartItemDto);
  }

  @Delete(':userId/items/:productId')
  @HttpCode(HttpStatus.OK)
  removeItem(@Param('userId') userId: string, @Param('productId') productId: string) {
    this.logger.log(`DELETE /cart/${userId}/items/${productId} - Removing item from cart`);
    return this.cartService.removeItem(userId, productId);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.OK)
  clearCart(@Param('userId') userId: string) {
    this.logger.log(`DELETE /cart/${userId} - Clearing cart`);
    return this.cartService.clearCart(userId);
  }
}
