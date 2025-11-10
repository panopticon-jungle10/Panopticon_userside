import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { StructuredLogger } from '../common/structured-logger.service';

@Injectable()
export class ProductsService implements OnModuleInit {
  private readonly logger = new StructuredLogger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async onModuleInit() {
    const count = await this.productsRepository.count();
    if (count === 0) {
      await this.productsRepository.save([
        {
          name: 'Laptop',
          description: 'High-performance laptop',
          price: 1200,
          stock: 50,
          category: 'Electronics',
        },
        {
          name: 'Wireless Mouse',
          description: 'Ergonomic wireless mouse',
          price: 25,
          stock: 200,
          category: 'Accessories',
        },
        {
          name: 'Mechanical Keyboard',
          description: 'RGB mechanical keyboard',
          price: 80,
          stock: 100,
          category: 'Accessories',
        },
      ]);
      this.logger.log('Seeded default products');
    }
  }

  findAll(): Promise<Product[]> {
    this.logger.log('Finding all products');
    return this.productsRepository.find();
  }

  async findOne(id: string): Promise<Product> {
    this.logger.log(`Finding product with id: ${id}`);
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      this.logger.warn(`Product with id ${id} not found`);
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    this.logger.log(`Creating new product: ${createProductDto.name}`);
    const product = this.productsRepository.create(createProductDto);
    const saved = await this.productsRepository.save(product);
    this.logger.log(`Product created successfully with id: ${saved.id}`);
    return saved;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    this.logger.log(`Updating product with id: ${id}`);
    const product = await this.findOne(id);
    const updated = await this.productsRepository.save({
      ...product,
      ...updateProductDto,
    });
    this.logger.log(`Product with id ${id} updated successfully`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing product with id: ${id}`);
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
    this.logger.log(`Product with id ${id} removed successfully`);
  }

  findByCategory(category: string): Promise<Product[]> {
    this.logger.log(`Finding products by category: ${category}`);
    return this.productsRepository.find({ where: { category } });
  }
}
