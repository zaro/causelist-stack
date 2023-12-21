import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import { Public } from './public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(AuthGuard('otp'))
  @Post('login')
  async login(@Request() req) {
    const result: any = await this.authService.login(req.user);
    result.user = req.user;
    return result;
  }
}
