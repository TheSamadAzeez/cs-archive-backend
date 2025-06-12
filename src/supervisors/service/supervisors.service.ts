import { Injectable, Logger } from '@nestjs/common';
import { and, count, eq, sql } from 'drizzle-orm';
import { DrizzleService } from 'src/database/drizzle.service';
import {
  projects,
  ProjectStatus,
  students,
  tasks,
  tasksStatusUpdate,
  projectStatusUpdate,
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

  private async getTotalStudents(supervisorId: number) {
    const supervisorStudents = await this.drizzle.db
      .select({
        totalStudents: count(),
      })
      .from(students)
      .where(eq(students.supervisorId, supervisorId));

    return supervisorStudents[0].totalStudents;
  }

  private async getTaskStatusCount(supervisorId: number, status: string) {
    const taskStatusCount = await this.drizzle.db
      .select({
        count: count(),
      })
      .from(tasks)
      .where(
        and(eq(tasks.supervisorId, supervisorId), eq(tasks.status, status)),
      );

    return taskStatusCount[0].count;
  }

  private async getProjectStatusCount(
    supervisorId: number,
    status: ProjectStatus,
  ) {
    const projectStatusCount = await this.drizzle.db
      .select({
        count: count(),
      })
      .from(projects)
      .where(
        and(
          eq(projects.supervisorId, supervisorId),
          eq(projects.status, status),
        ),
      );

    return projectStatusCount[0].count;
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

  async getDashboardStats(supervisorId: number) {
    const totalStudents = await this.getTotalStudents(supervisorId);

    const tasksStatus = {
      pending: await this.getTaskStatusCount(supervisorId, 'Pending'),
      completed: await this.getTaskStatusCount(supervisorId, 'Completed'),
      rejected: await this.getTaskStatusCount(supervisorId, 'Rejected'),
      underReview: await this.getTaskStatusCount(supervisorId, 'Under Review'),
    };

    const projectsStatus = {
      inProgress: await this.getProjectStatusCount(supervisorId, 'In Progress'),
      notStarted: await this.getProjectStatusCount(supervisorId, 'Not Started'),
      completed: await this.getProjectStatusCount(supervisorId, 'Completed'),
    };

    const projectSummary = await this.drizzle.db.query.projects.findMany({
      where: eq(projects.supervisorId, supervisorId),
      with: {
        student: true,
      },
      limit: 6,
    });

    const taskSummary = await this.drizzle.db.query.tasks.findMany({
      where: eq(tasks.supervisorId, supervisorId),
      with: {
        student: true,
      },
      limit: 6,
    });

    const tasksMetrics = await this.getTasksMetrics(supervisorId);
    const projectsMetrics = await this.getProjectsMetrics(supervisorId);

    return {
      totalStudents,
      tasksStatus,
      projectsStatus,
      projectSummary,
      taskSummary,
      tasksMetrics,
      projectsMetrics,
    };
  }
}
