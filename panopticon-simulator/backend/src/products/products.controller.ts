import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { StructuredLogger } from '../common/structured-logger.service';

@Controller('products')
export class ProductsController {
  private readonly logger = new StructuredLogger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query('category') category?: string) {
    this.logger.log('GET /products - Fetching all products');
    if (category) {
      this.logger.log(`Filtering by category: ${category}`);
      return this.productsService.findByCategory(category);
    }
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    this.logger.log(`GET /products/${id} - Fetching product`);
    return this.productsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProductDto: CreateProductDto) {
    this.logger.log('POST /products - Creating new product');
    return this.productsService.create(createProductDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    this.logger.log(`PUT /products/${id} - Updating product`);
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    this.logger.log(`DELETE /products/${id} - Removing product`);
    this.productsService.remove(id);
  }
}
