import { Body, Controller, Get, Post, Put, Req, Res } from '@nestjs/common';
import {
  UsersService,
  CreateUserDataParams,
  UpdateUserDataParams,
} from './users.service.js';
import { Public } from '../auth/public.decorator.js';
import { Types } from 'mongoose';
import { Response } from 'express';
import { stringify } from 'csv-stringify';
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { RequestWithUser } from '../auth/request.js';

export class UpdateUserParams {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  firstName: string;
}

@Controller('users')
export class UsersController {
  constructor(protected usersService: UsersService) {}

  @Public()
  @Post('new')
  async newUser(@Body() params: CreateUserDataParams) {
    return this.usersService.createUser(params);
  }

  @Put('update')
  async updateUser(
    @Req() req: RequestWithUser,
    @Body() params: UpdateUserDataParams,
  ) {
    return this.usersService.updateById(req.user.id, params);
  }

  @Get('stats')
  async stats() {
    return this.usersService.userStats();
  }

  @Get('export')
  async export(@Res() response: Response) {
    const csvStringify = stringify({
      header: true,
      columns: [
        '_id',
        'phone',
        'email',
        'firstName',
        'lastName',
        'role',
        'createdAt',
        'updatedAt',
      ],
      cast: {
        date: (value: Date) => {
          return value.toISOString();
        },
        object: (value: object) => {
          return value instanceof Types.ObjectId
            ? value.toHexString()
            : value.toString();
        },
      },
    });
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="users.csv"',
    );
    return this.usersService.listAll().pipe(csvStringify).pipe(response);
  }
}
