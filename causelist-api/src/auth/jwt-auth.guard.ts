import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY, IS_INTERNAL_ROUTE_KEY } from './public.decorator.js';

export const DETECT_REVERSE_PROXY_HEADER = 'x-forwarded-for';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isInternalRoute = this.reflector.getAllAndOverride<boolean>(
      IS_INTERNAL_ROUTE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    if (isInternalRoute) {
      this.logger.log(
        `internalRoute ${isInternalRoute} ${JSON.stringify(request.headers)}`,
      );
      if (request.headers[DETECT_REVERSE_PROXY_HEADER]) {
        this.logger.error(
          `Route marked as internal but Request coming from reverse proxy, disallowing!`,
        );
        return false;
      }
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
