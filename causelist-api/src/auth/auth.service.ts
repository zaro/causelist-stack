import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { User, UserDocument } from '../schemas/user.schema.js';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(userPhone: string, code: string): Promise<User | null> {
    const user = await this.usersService.checkOtp(userPhone, code);
    if (user) {
      return user;
    }
    return null;
  }

  async login(user: User) {
    const payload = { sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
