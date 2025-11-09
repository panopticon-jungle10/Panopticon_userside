import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    const count = await this.usersRepository.count();
    if (count === 0) {
      await this.usersRepository.save([
        { email: 'john@example.com', name: 'John Doe' },
        { email: 'jane@example.com', name: 'Jane Smith' },
      ]);
      this.logger.log('Seeded default users');
    }
  }

  findAll(): Promise<User[]> {
    this.logger.log('Finding all users');
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    this.logger.log(`Finding user with id: ${id}`);
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      this.logger.warn(`User with id ${id} not found`);
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  findByEmail(email: string): Promise<User | null> {
    this.logger.log(`Finding user with email: ${email}`);
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating new user: ${createUserDto.email}`);
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      this.logger.warn(`User with email ${createUserDto.email} already exists`);
      throw new ConflictException(`User with email ${createUserDto.email} already exists`);
    }
    const user = this.usersRepository.create(createUserDto);
    const saved = await this.usersRepository.save(user);
    this.logger.log(`User created successfully with id: ${saved.id}`);
    return saved;
  }
}
