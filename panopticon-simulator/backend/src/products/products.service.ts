import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
@Injectable()
export class ProductsService implements OnModuleInit {

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
    }
  }

  findAll(): Promise<Product[]> {
    return this.productsRepository.find();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create(createProductDto);
    const saved = await this.productsRepository.save(product);
    return saved;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    const updated = await this.productsRepository.save({
      ...product,
      ...updateProductDto,
    });
    return updated;
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
  }

  findByCategory(category: string): Promise<Product[]> {
    return this.productsRepository.find({ where: { category } });
  }
}
