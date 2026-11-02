import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const frontendUrl = config.get<string>('FRONTEND_URL', 'http://localhost:3000');
  const adminUrl = config.get<string>('ADMIN_URL', 'http://localhost:3002');

  app.enableCors({
    origin: [frontendUrl, adminUrl],
    credentials: true,
  });

  const port = config.get<number>('PORT', 3001);
  await app.listen(port);
}
await bootstrap();
