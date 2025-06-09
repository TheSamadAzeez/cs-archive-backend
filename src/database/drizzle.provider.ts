import { DynamicModule, Global, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { ConfigService } from '@nestjs/config';

export const DRIZZLE_ORM = 'DRIZZLE_ORM';

@Global()
@Module({})
export class DrizzleModule {
  static forRoot(): DynamicModule {
    const drizzleProvider = {
      provide: DRIZZLE_ORM,
      useFactory: (configService: ConfigService) => {
        const pool = new Pool({
          connectionString: configService.get<string>('DATABASE_URL'),
          ssl:
            process.env.NODE_ENV === 'production'
              ? { rejectUnauthorized: false }
              : false,
        });
        return drizzle(pool, { schema: { ...schema } });
      },
      inject: [ConfigService],
    };

    return {
      module: DrizzleModule,
      providers: [drizzleProvider],
      exports: [drizzleProvider],
    };
  }
}
