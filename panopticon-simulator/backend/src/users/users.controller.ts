import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { StructuredLogger } from '../common/structured-logger.service';

@Controller('users')
export class UsersController {
  private readonly logger = new StructuredLogger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    this.logger.log('GET /users - Fetching all users');
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    this.logger.log(`GET /users/${id} - Fetching user`);
    return this.usersService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    this.logger.log('POST /users - Creating new user');
    return this.usersService.create(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() payload: { email: string; name?: string }) {
    this.logger.log(`POST /users/login - email: ${payload.email}`);
    return this.usersService.findOrCreateByEmail(payload.email, payload.name);
  }
}
