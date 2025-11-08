import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private products: Product[] = [];

  constructor() {
    // Initialize with some sample products
    this.products = [
      {
        id: uuidv4(),
        name: 'Laptop',
        description: 'High-performance laptop',
        price: 1200,
        stock: 50,
        category: 'Electronics',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse',
        price: 25,
        stock: 200,
        category: 'Accessories',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Mechanical Keyboard',
        description: 'RGB mechanical keyboard',
        price: 80,
        stock: 100,
        category: 'Accessories',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  findAll(): Product[] {
    this.logger.log(`Finding all products. Total: ${this.products.length}`);
    return this.products;
  }

  findOne(id: string): Product {
    this.logger.log(`Finding product with id: ${id}`);
    const product = this.products.find((p) => p.id === id);
    if (!product) {
      this.logger.warn(`Product with id ${id} not found`);
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  create(createProductDto: CreateProductDto): Product {
    this.logger.log(`Creating new product: ${createProductDto.name}`);
    const newProduct: Product = {
      id: uuidv4(),
      ...createProductDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.push(newProduct);
    this.logger.log(`Product created successfully with id: ${newProduct.id}`);
    return newProduct;
  }

  update(id: string, updateProductDto: UpdateProductDto): Product {
    this.logger.log(`Updating product with id: ${id}`);
    const productIndex = this.products.findIndex((p) => p.id === id);
    if (productIndex === -1) {
      this.logger.warn(`Product with id ${id} not found for update`);
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    const updatedProduct = {
      ...this.products[productIndex],
      ...updateProductDto,
      updatedAt: new Date(),
    };
    this.products[productIndex] = updatedProduct;
    this.logger.log(`Product with id ${id} updated successfully`);
    return updatedProduct;
  }

  remove(id: string): void {
    this.logger.log(`Removing product with id: ${id}`);
    const productIndex = this.products.findIndex((p) => p.id === id);
    if (productIndex === -1) {
      this.logger.warn(`Product with id ${id} not found for removal`);
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    this.products.splice(productIndex, 1);
    this.logger.log(`Product with id ${id} removed successfully`);
  }

  findByCategory(category: string): Product[] {
    this.logger.log(`Finding products by category: ${category}`);
    return this.products.filter((p) => p.category === category);
  }
}
