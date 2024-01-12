import { Controller, Get, Logger } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckError,
  HealthCheckService,
  HealthIndicatorResult,
  HttpHealthIndicator,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../auth/public.decorator.js';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);
  protected shuttingDown = false;

  constructor(
    private health: HealthCheckService,
    private mongo: MongooseHealthIndicator,
  ) {}

  onModuleDestroy() {
    this.shuttingDown = true;
    this.logger.log(
      `Application is shutting down, transition to unhealthy state`,
    );
  }

  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.mongo.pingCheck('database'),
      () => {
        const result: HealthIndicatorResult = {
          gracefulShutdown: {
            status: this.shuttingDown ? 'down' : 'up',
          },
        };
        if (this.shuttingDown) {
          throw new HealthCheckError('Application is shutting down', result);
        }
        return Promise.resolve(result);
      },
    ]);
  }
}
