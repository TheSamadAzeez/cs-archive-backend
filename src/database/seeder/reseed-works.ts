import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { SeederService } from './seeder.service';

async function reseedWorks() {
  console.log('🚀 Starting Works Reseeding Process...\n');

  const app = await NestFactory.create(SeederModule);
  const seederService = app.get(SeederService);

  try {
    await seederService.reseedWorks();
    console.log('\n✅ Works reseeding completed successfully!');
  } catch (error) {
    console.error('\n❌ Error during works reseeding:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

reseedWorks();
