import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as databaseSchema from './schema';
import { CONNECTION_POOL } from './database.module-definition';

type DatabaseSchema = typeof databaseSchema;

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DrizzleService.name);
  public db: NodePgDatabase<DatabaseSchema>;

  constructor(@Inject(CONNECTION_POOL) private readonly pool: Pool) {
    this.db = drizzle(this.pool, {
      schema: { ...databaseSchema },
      casing: 'snake_case',
    });
  }

  async onModuleInit() {
    try {
      await this.pool.query('SELECT 1');
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error('Failed to connect to the database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.pool.end();
      this.logger.log('Database connection closed');
    } catch (error) {
      this.logger.error('Error while closing database connection', error);
      throw error;
    }
  }

  async getClient() {
    try {
      const client = await this.pool.connect();
      return client;
    } catch (error) {
      this.logger.error('Failed to get database client', error);
      throw error;
    }
  }
}
