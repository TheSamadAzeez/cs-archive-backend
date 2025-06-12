import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { CONNECTION_POOL } from './database.module-definition';
import { DrizzleService } from './drizzle.service';

export const DRIZZLE = Symbol('DRIZZLE_CONNECTION');

@Module({})
export class DrizzleModule {
  static forRootAsync(): DynamicModule {
    return {
      module: DrizzleModule,
      global: true,
      imports: [ConfigModule],
      providers: [
        {
          provide: CONNECTION_POOL,
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const databaseURL = configService.get<string>('DATABASE_URL');
            const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
            if (!databaseURL) {
              throw new Error('DATABASE_URL is not set');
            }
            const pool = new Pool({
              connectionString: databaseURL,
              ssl: nodeEnv === 'production',
            });
            return pool;
          },
        },
        DrizzleService,
      ],
      exports: [DrizzleService],
    };
  }
}
