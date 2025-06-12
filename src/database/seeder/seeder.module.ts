import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from '../drizzle.module';
import { SeederService } from './seeder.service';

@Module({
  imports: [ConfigModule.forRoot(), DrizzleModule.forRootAsync()],
  providers: [SeederService, Logger],
})
export class SeederModule {}
