import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { SeederModule } from './seeder.module';
import { SeederService } from './seeder.service';

async function bootstrap() {
  const app = await NestFactory.create(SeederModule);
  const logger = app.get(Logger);
  const seeder = app.get(SeederService);
  seeder
    .seed()
    .then(() => {
      logger.debug('Seeding complete!');
    })
    .catch((error) => {
      logger.error('Seeding failed!');
      throw error;
    })
    .finally(() => {
      app.close();
    });
}
bootstrap();
