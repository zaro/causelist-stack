import { NestFactory } from '@nestjs/core';
import { CommandModule, CommandService } from 'nestjs-command/dist/index.js';
import { CommandsModule } from './commands.module.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(CommandsModule, {});

  try {
    await app.select(CommandModule).get(CommandService).exec();
    await app.close();
  } catch (error) {
    console.error(error);
    await app.close();
    process.exit(1);
  }
}

bootstrap();
