import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private users: User[] = [];

  constructor() {
    // Initialize with sample users
    this.users = [
      {
        id: uuidv4(),
        email: 'john@example.com',
        name: 'John Doe',
        createdAt: new Date(),
      },
      {
        id: uuidv4(),
        email: 'jane@example.com',
        name: 'Jane Smith',
        createdAt: new Date(),
      },
    ];
  }

  findAll(): User[] {
    this.logger.log(`Finding all users. Total: ${this.users.length}`);
    return this.users;
  }

  findOne(id: string): User {
    this.logger.log(`Finding user with id: ${id}`);
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      this.logger.warn(`User with id ${id} not found`);
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  findByEmail(email: string): User | undefined {
    this.logger.log(`Finding user with email: ${email}`);
    return this.users.find((u) => u.email === email);
  }

  create(createUserDto: CreateUserDto): User {
    this.logger.log(`Creating new user: ${createUserDto.email}`);

    // Check if email already exists
    const existingUser = this.findByEmail(createUserDto.email);
    if (existingUser) {
      this.logger.warn(`User with email ${createUserDto.email} already exists`);
      throw new ConflictException(`User with email ${createUserDto.email} already exists`);
    }

    const newUser: User = {
      id: uuidv4(),
      ...createUserDto,
      createdAt: new Date(),
    };

    this.users.push(newUser);
    this.logger.log(`User created successfully with id: ${newUser.id}`);
    return newUser;
  }
}
