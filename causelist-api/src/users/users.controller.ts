import { Body, Controller, Post } from '@nestjs/common';
import { UsersService, CreateUserDataParams } from './users.service.js';
import { Public } from '../auth/public.decorator.js';

@Controller('users')
export class UsersController {
  constructor(protected usersService: UsersService) {}

  @Public()
  @Post('new')
  async newUser(@Body() params: CreateUserDataParams) {
    return this.usersService.createUser(params);
  }
}
