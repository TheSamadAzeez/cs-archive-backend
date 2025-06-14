import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DrizzleService } from 'src/database/drizzle.service';
import { eq, count, and, sql } from 'drizzle-orm';
import { tasks, tasksStatusUpdate } from 'src/database/schema';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);
  constructor(private readonly drizzle: DrizzleService) {}

  async getCompletedTasks(studentId: number) {
    const result = await this.drizzle.db.query.tasks.findMany({
      where: eq(tasks.studentId, studentId),
      columns: {
        id: true,
        task: true,
        description: true,
        status: true,
        dueDate: true,
        updatedAt: true,
      },
      orderBy: (tasks, { desc }) => [desc(tasks.updatedAt)],
    });

    const completedTasks = result.filter((task) => task.status === 'Completed');
    if (!completedTasks.length) {
      throw new NotFoundException('No completed tasks found for this student');
    }
    return completedTasks;
  }

  async getPendingTasks(studentId: number) {
    const result = await this.drizzle.db.query.tasks.findMany({
      where: eq(tasks.studentId, studentId),
      columns: {
        id: true,
        task: true,
        description: true,
        status: true,
        dueDate: true,
        updatedAt: true,
      },
      orderBy: (tasks, { desc }) => [desc(tasks.updatedAt)],
    });

    const pendingTasks = result.filter((task) => task.status === 'Pending');
    if (!pendingTasks.length) {
      throw new NotFoundException('No pending tasks found for this student');
    }
    return pendingTasks;
  }

  async getRejectedTasks(studentId: number) {
    const result = await this.drizzle.db.query.tasks.findMany({
      where: eq(tasks.studentId, studentId),
      columns: {
        id: true,
        task: true,
        description: true,
        status: true,
        dueDate: true,
        updatedAt: true,
      },
      orderBy: (tasks, { desc }) => [desc(tasks.updatedAt)],
    });

    const rejectedTasks = result.filter((task) => task.status === 'Rejected');
    if (!rejectedTasks.length) {
      throw new NotFoundException('No rejected tasks found for this student');
    }
    return rejectedTasks;
  }

  async getUnderReviewTasks(studentId: number) {
    const result = await this.drizzle.db.query.tasks.findMany({
      where: eq(tasks.studentId, studentId),
      columns: {
        id: true,
        task: true,
        description: true,
        status: true,
        dueDate: true,
        updatedAt: true,
      },
      orderBy: (tasks, { desc }) => [desc(tasks.updatedAt)],
    });

    const underReviewTasks = result.filter((task) => task.status === 'Under Review');
    if (!underReviewTasks.length) {
      throw new NotFoundException('No tasks under review found for this student');
    }
    return underReviewTasks;
  }

  async getDashboardStats(studentId: number) {
    try {
      this.logger.log(`Fetching dashboard stats for student ID: ${studentId}`);

      // Execute queries in parallel for better performance
      const [taskStatusCounts, taskSummary, tasksMetrics] = await Promise.all([
        // Get all task status counts in a single query
        this.drizzle.db
          .select({
            status: tasks.status,
            count: count(),
          })
          .from(tasks)
          .where(eq(tasks.studentId, studentId))
          .groupBy(tasks.status),

        // Task summary (last 6 updated tasks)
        this.drizzle.db.query.tasks.findMany({
          where: eq(tasks.studentId, studentId),
          columns: {
            id: true,
            task: true,
            description: true,
            status: true,
            updatedAt: true,
          },
          orderBy: (tasks, { desc }) => [desc(tasks.updatedAt)],
          limit: 6,
        }),

        // Get task metrics
        this.getTasksMetrics(studentId),
      ]);

      // Process task status counts into the expected format
      const tasksStatus = {
        pending: 0,
        completed: 0,
        rejected: 0,
        underReview: 0,
      };

      taskStatusCounts.forEach((item) => {
        if (item.status === 'Pending') tasksStatus.pending = Number(item.count);
        if (item.status === 'Completed') tasksStatus.completed = Number(item.count);
        if (item.status === 'Rejected') tasksStatus.rejected = Number(item.count);
        if (item.status === 'Under Review') tasksStatus.underReview = Number(item.count);
      });

      return {
        tasksStatus,
        taskSummary,
        tasksMetrics,
      };
    } catch (error) {
      this.logger.error(`Error fetching dashboard stats for student ${studentId}:`, error);
      throw error;
    }
  }

  private async getTasksMetrics(studentId: number): Promise<Record<string, Array<Record<string, number>>>> {
    // Get metrics for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1); // Start from the 1st of the month
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // Join tasks with tasksStatusUpdate to get student tasks with their status updates
    const taskUpdates = await this.drizzle.db
      .select({
        month: sql`to_char(${tasksStatusUpdate.createdAt}, 'YYYY-MM')`,
        status: tasksStatusUpdate.status,
        count: count(),
      })
      .from(tasksStatusUpdate)
      .innerJoin(tasks, eq(tasksStatusUpdate.taskId, tasks.id))
      .where(and(eq(tasks.studentId, studentId), sql`${tasksStatusUpdate.createdAt} >= ${sixMonthsAgo.toISOString()}`))
      .groupBy(sql`to_char(${tasksStatusUpdate.createdAt}, 'YYYY-MM')`, tasksStatusUpdate.status)
      .orderBy(sql`to_char(${tasksStatusUpdate.createdAt}, 'YYYY-MM')`);

    // Process the results into the required format
    const monthlyData: Record<string, Array<Record<string, number>>> = {};
    const months = this.getLast6MonthsNames();

    // Initialize each month with empty data
    months.forEach((month) => {
      monthlyData[month] = [{ Pending: 0, Completed: 0, Rejected: 0, 'Under Review': 0 }];
    });

    // Fill in the data from query results
    taskUpdates.forEach((update) => {
      const monthKey = this.getMonthNameFromDbFormat(update.month as string);
      if (monthlyData[monthKey] && update.status) {
        if (Object.prototype.hasOwnProperty.call(monthlyData[monthKey][0], update.status)) {
          monthlyData[monthKey][0][update.status] = Number(update.count);
        }
      }
    });

    return monthlyData;
  }

  private getLast6MonthsNames(): string[] {
    const months: string[] = [];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date();
      month.setMonth(today.getMonth() - i);
      months.push(`${monthNames[month.getMonth()]} ${month.getFullYear()}`);
    }

    return months;
  }

  private getMonthNameFromDbFormat(dbFormat: string): string {
    if (!dbFormat) return '';

    const [year, month] = dbFormat.split('-');
    const monthIndex = parseInt(month, 10) - 1;
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return `${monthNames[monthIndex]} ${year}`;
  }

  async getAllTasks(studentId: number) {
    return this.drizzle.db.query.tasks.findMany({
      where: eq(tasks.studentId, studentId),
      columns: {
        id: true,
        task: true,
        status: true,
        description: true,
        createdAt: true,
        dueDate: true,
      },
      orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
    });
  }
}
