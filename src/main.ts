import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const isProduction =
    process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
  const frontendOrigin =
    process.env.FRONTEND_URL?.trim().replace(/\/+$/, '') ||
    (isProduction ? undefined : 'http://localhost:5173');

  app.enableCors({
    origin:
      frontendOrigin && /^https?:\/\/[^/?#]+$/i.test(frontendOrigin)
        ? [frontendOrigin]
        : false,
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
