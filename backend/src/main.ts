// This import must be the first one: the other files read process.env when they load.
import './load-env';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ProblemDetailsFilter } from './presentation/filters/problem-details.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // The frontend runs in another port, so the browser needs this permission
  app.enableCors();

  // Checks every DTO. whitelist removes the fields that are not in the DTO.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Every error answers with the same shape (RFC 9457)
  app.useGlobalFilters(new ProblemDetailsFilter());

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
