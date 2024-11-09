import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';

import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('backend');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  );
  app.enableCors({
    origin: [
      'https://travelland-frontend-fpkv.vercel.app',
      'http://localhost:3000',
      'http://localhost:4000',
      'https://traventico.com',
    ],
    credentials: true,
  });
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(4000);
}

bootstrap();
