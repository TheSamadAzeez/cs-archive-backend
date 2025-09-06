import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from 'src/database/drizzle.service';

@Injectable()
export class WorksService {
  private readonly logger = new Logger(WorksService.name);

  constructor(private readonly drizzle: DrizzleService) {}

  async getAllWorks() {
    try {
      const allWorks = await this.drizzle.db.query.works.findMany({
        with: {
          student: {
            columns: {
              id: true,
              matricNumber: true,
              firstName: true,
              lastName: true,
              fullName: true,
            },
          },
          supervisor: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
            },
          },
        },
        orderBy: (works, { desc }) => [desc(works.createdAt)],
      });

      return allWorks;
    } catch (error) {
      this.logger.error(`Failed to get all works: ${error.message}`);
      throw error;
    }
  }
}
