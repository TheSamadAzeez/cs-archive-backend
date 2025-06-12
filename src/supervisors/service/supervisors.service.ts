import { Injectable, Logger } from '@nestjs/common';
import { and, count, eq, sql } from 'drizzle-orm';
import { DrizzleService } from 'src/database/drizzle.service';
import {
  projects,
  projectStatusUpdate,
  students,
  tasks,
  tasksStatusUpdate,
} from 'src/database/schema';

@Injectable()
export class SupervisorsService {
  private readonly logger = new Logger(SupervisorsService.name);
  constructor(private readonly drizzle: DrizzleService) {}

  async getStudentsBySupervisor(supervisorId: number) {
    this.logger.log(
      `Fetching students for supervisor with ID: ${supervisorId}`,
    );

    const supervisorStudents = await this.drizzle.db.query.students.findMany({
      where: eq(students.supervisorId, supervisorId),
      with: {
        tasks: true,
      },
    });

    const studentProjects = await this.drizzle.db.query.projects.findMany({
      where: eq(projects.studentId, supervisorId),
    });

    return supervisorStudents.map((student) => ({
      studentName: `${student.firstName} ${student.lastName}`,
      matricNumber: student.matricNumber,
      email: student.email,
      project:
        studentProjects.find((project) => project.studentId === student.id) ||
        null,
      taskHistory: student.tasks.map((task) => ({
        taskName: task.task,
        description: task.description,
        status: task.status,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      })),
    }));
  }

  async getDashboardStats(supervisorId: number) {
    try {
      this.logger.log(
        `Fetching dashboard stats for supervisor ID: ${supervisorId}`,
      );

      // Execute queries in parallel for better performance
      const [
        totalStudentsResult,
        taskStatusCounts,
        projectStatusCounts,
        projectSummary,
        taskSummary,
        tasksMetrics,
        projectsMetrics,
      ] = await Promise.all([
        // Get total students in one query
        this.drizzle.db
          .select({ totalStudents: count() })
          .from(students)
          .where(eq(students.supervisorId, supervisorId)),

        // Get all task status counts in a single query
        this.drizzle.db
          .select({
            status: tasks.status,
            count: count(),
          })
          .from(tasks)
          .where(eq(tasks.supervisorId, supervisorId))
          .groupBy(tasks.status),

        // Get all project status counts in a single query
        this.drizzle.db
          .select({
            status: projects.status,
            count: count(),
          })
          .from(projects)
          .where(eq(projects.supervisorId, supervisorId))
          .groupBy(projects.status),

        // Project summary
        this.drizzle.db.query.projects.findMany({
          where: eq(projects.supervisorId, supervisorId),
          with: {
            student: true,
          },
          orderBy: (projects, { desc }) => [desc(projects.updatedAt)],
          limit: 6,
        }),

        // Task summary
        this.drizzle.db.query.tasks.findMany({
          where: eq(tasks.supervisorId, supervisorId),
          with: {
            student: true,
          },
          orderBy: (tasks, { desc }) => [desc(tasks.updatedAt)],
          limit: 6,
        }),

        // Get task metrics
        this.getTasksMetrics(supervisorId),

        // Get project metrics
        this.getProjectsMetrics(supervisorId),
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
        if (item.status === 'Completed')
          tasksStatus.completed = Number(item.count);
        if (item.status === 'Rejected')
          tasksStatus.rejected = Number(item.count);
        if (item.status === 'Under Review')
          tasksStatus.underReview = Number(item.count);
      });

      // Process project status counts into the expected format
      const projectsStatus = {
        notStarted: 0,
        inProgress: 0,
        completed: 0,
      };

      projectStatusCounts.forEach((item) => {
        if (item.status === 'Not Started')
          projectsStatus.notStarted = Number(item.count);
        if (item.status === 'In Progress')
          projectsStatus.inProgress = Number(item.count);
        if (item.status === 'Completed')
          projectsStatus.completed = Number(item.count);
      });

      return {
        totalStudents: Number(totalStudentsResult[0]?.totalStudents || 0),
        tasksStatus,
        projectsStatus,
        projectSummary,
        taskSummary,
        tasksMetrics,
        projectsMetrics,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching dashboard stats for supervisor ${supervisorId}:`,
        error,
      );
      throw error;
    }
  }

  private async getTasksMetrics(
    supervisorId: number,
  ): Promise<Record<string, Array<Record<string, number>>>> {
    // Get metrics for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1); // Start from the 1st of the month
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // Join tasks with tasksStatusUpdate to get supervisor tasks with their status updates
    const taskUpdates = await this.drizzle.db
      .select({
        month: sql`to_char(${tasksStatusUpdate.createdAt}, 'YYYY-MM')`,
        status: tasksStatusUpdate.status,
        count: count(),
      })
      .from(tasksStatusUpdate)
      .innerJoin(tasks, eq(tasksStatusUpdate.taskId, tasks.id))
      .where(
        and(
          eq(tasks.supervisorId, supervisorId),
          sql`${tasksStatusUpdate.createdAt} >= ${sixMonthsAgo.toISOString()}`,
        ),
      )
      .groupBy(
        sql`to_char(${tasksStatusUpdate.createdAt}, 'YYYY-MM')`,
        tasksStatusUpdate.status,
      )
      .orderBy(sql`to_char(${tasksStatusUpdate.createdAt}, 'YYYY-MM')`);

    // Process the results into the required format
    const monthlyData: Record<string, Array<Record<string, number>>> = {};
    const months = this.getLast6MonthsNames();

    // Initialize each month with empty data
    months.forEach((month) => {
      monthlyData[month] = [
        { Pending: 0, Completed: 0, Rejected: 0, 'Under Review': 0 },
      ];
    });

    // Fill in the data from query results
    taskUpdates.forEach((update) => {
      const monthKey = this.getMonthNameFromDbFormat(update.month as string);
      if (monthlyData[monthKey] && update.status) {
        // Use Object.prototype.hasOwnProperty.call to avoid linter error
        if (
          Object.prototype.hasOwnProperty.call(
            monthlyData[monthKey][0],
            update.status,
          )
        ) {
          monthlyData[monthKey][0][update.status] = Number(update.count);
        }
      }
    });

    return monthlyData;
  }

  private async getProjectsMetrics(
    supervisorId: number,
  ): Promise<Record<string, Array<Record<string, number>>>> {
    // Get metrics for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1); // Start from the 1st of the month
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // Join projects with projectStatusUpdate to get supervisor projects with their status updates
    const projectUpdates = await this.drizzle.db
      .select({
        month: sql`to_char(${projectStatusUpdate.createdAt}, 'YYYY-MM')`,
        status: projectStatusUpdate.status,
        count: count(),
      })
      .from(projectStatusUpdate)
      .innerJoin(projects, eq(projectStatusUpdate.projectId, projects.id))
      .where(
        and(
          eq(projects.supervisorId, supervisorId),
          sql`${projectStatusUpdate.createdAt} >= ${sixMonthsAgo.toISOString()}`,
        ),
      )
      .groupBy(
        sql`to_char(${projectStatusUpdate.createdAt}, 'YYYY-MM')`,
        projectStatusUpdate.status,
      )
      .orderBy(sql`to_char(${projectStatusUpdate.createdAt}, 'YYYY-MM')`);

    // Process the results into the required format
    const monthlyData: Record<string, Array<Record<string, number>>> = {};
    const months = this.getLast6MonthsNames();

    // Initialize each month with empty data
    months.forEach((month) => {
      monthlyData[month] = [
        { 'Not Started': 0, 'In Progress': 0, Completed: 0 },
      ];
    });

    // Fill in the data from query results
    projectUpdates.forEach((update) => {
      const monthKey = this.getMonthNameFromDbFormat(update.month as string);
      if (monthlyData[monthKey] && update.status) {
        // Use Object.prototype.hasOwnProperty.call to avoid linter error
        if (
          Object.prototype.hasOwnProperty.call(
            monthlyData[monthKey][0],
            update.status,
          )
        ) {
          monthlyData[monthKey][0][update.status] = Number(update.count);
        }
      }
    });

    return monthlyData;
  }

  private getLast6MonthsNames(): string[] {
    const months: string[] = [];
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

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
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    return `${monthNames[monthIndex]} ${year}`;
  }
}
