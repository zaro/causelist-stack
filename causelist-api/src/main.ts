import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      enableDebugMessages: true,
      whitelist: true,
      exceptionFactory(errors) {
        return new BadRequestException(
          errors.reduce(
            (acc, { property, constraints }) => ({
              ...acc,
              [property]: Object.values(constraints),
            }),
            {},
          ),
        );
      },
    }),
  );
  await app.listen(parseInt(process.env.PORT) || 3000);
}
bootstrap();
