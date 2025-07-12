import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, count, eq, sql } from 'drizzle-orm';
import { DrizzleService } from 'src/database/drizzle.service';
import { projects, projectStatusUpdate, students, Task, tasks, tasksStatusUpdate, taskSubmissions } from 'src/database/schema';
import { ReviewTaskDto, TaskSubmissionStatus } from '../dto/review-task.dto';
import { NotificationsService, NotificationType } from 'src/notifications/notifications.service';

@Injectable()
export class SupervisorsService {
  private readonly logger = new Logger(SupervisorsService.name);
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getStudentTasks(supervisorId: number, studentId: number) {
    const result = await this.drizzle.db.query.tasks.findMany({
      where: and(eq(tasks.studentId, studentId), eq(tasks.supervisorId, supervisorId)),
      with: {
        taskSubmissions: true,
      },
    });
    return result;
  }

  async getStudentTask(supervisorId: number, studentId: number, taskId: number) {
    const result = await this.drizzle.db.query.tasks.findFirst({
      where: and(eq(tasks.id, taskId), eq(tasks.studentId, studentId), eq(tasks.supervisorId, supervisorId)),
      with: {
        taskSubmissions: true,
      },
    });
    return result;
  }

  async reviewTask(supervisorId: number, studentId: number, taskId: number, reviewTaskDto: ReviewTaskDto) {
    return this.drizzle.db.transaction(async (tx) => {
      // Find the submission by taskId, studentId, supervisorId
      const taskSubmission = await tx.query.taskSubmissions.findFirst({
        where: and(eq(taskSubmissions.taskId, taskId), eq(taskSubmissions.studentId, studentId), eq(taskSubmissions.supervisorId, supervisorId)),
      });
      if (!taskSubmission) {
        throw new NotFoundException('Task submission not found');
      }

      // Update task submission
      await tx
        .update(taskSubmissions)
        .set({
          status: reviewTaskDto.status,
          feedback: reviewTaskDto.feedback,
        })
        .where(eq(taskSubmissions.id, taskSubmission.id))
        .returning();

      // Decide new task status
      let newTaskStatus: string;
      if (reviewTaskDto.status === TaskSubmissionStatus.Approved) {
        newTaskStatus = 'Completed';
      } else if (reviewTaskDto.status === TaskSubmissionStatus.Rejected) {
        newTaskStatus = 'Pending'; // Reassign to student
      } else {
        newTaskStatus = reviewTaskDto.status;
      }

      // Update task
      const [updatedTask] = await tx
        .update(tasks)
        .set({
          status: newTaskStatus,
        })
        .where(eq(tasks.id, taskSubmission.taskId))
        .returning();

      // Check if we need to update project status to "In Progress"
      if (updatedTask.status === 'Completed') {
        const project = await tx.query.projects.findFirst({
          where: eq(projects.studentId, studentId),
        });

        if (project && project.status === 'Not Started') {
          // Insert into project status update table
          await tx.insert(projectStatusUpdate).values({
            projectId: project.id,
            status: 'In Progress',
            createdAt: new Date(),
          });

          // Actually update the project's status field
          await tx
            .update(projects)
            .set({
              status: 'In Progress',
              updatedAt: new Date(),
            })
            .where(eq(projects.id, project.id));
        }
      }

      await tx.insert(tasksStatusUpdate).values({
        taskId: taskSubmission.taskId,
        status: updatedTask.status,
      });

      if (reviewTaskDto.status === TaskSubmissionStatus.Approved) {
        await this.notificationsService.createNotification(
          studentId,
          'student',
          NotificationType.TASK_APPROVED,
          'Task Approved!',
          `Your task submission has been approved. Feedback: ${reviewTaskDto.feedback || 'Good work!'}`,
          taskId,
          'task',
        );
      } else if (reviewTaskDto.status === TaskSubmissionStatus.Rejected) {
        await this.notificationsService.createNotification(
          studentId,
          'student',
          NotificationType.TASK_REJECTED,
          'Task Needs Revision',
          `Your task submission needs revision. Feedback: ${reviewTaskDto.feedback || 'Please review and resubmit.'}`,
          taskId,
          'task',
        );
      }

      return updatedTask;
    });
  }

  async getStudents(supervisorId: number) {
    const result = await this.drizzle.db.query.students.findMany({
      where: eq(students.supervisorId, supervisorId),
      with: {
        tasks: {
          columns: {
            id: true,
            task: true,
            description: true,
            status: true,
          },
        },
        project: {
          columns: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return result.map((student) => ({
      ...student,
      tasksProgress: this.calculateTasksProgress(student.tasks),
    }));
  }

  async getStudentById(supervisorId: number, studentId: number) {
    const result = await this.drizzle.db.query.students.findFirst({
      where: and(eq(students.id, studentId), eq(students.supervisorId, supervisorId)),
      with: {
        tasks: {
          columns: {
            id: true,
            task: true,
            description: true,
            status: true,
          },
        },
        project: {
          columns: {
            id: true,
            title: true,
            description: true,
            status: true,
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException('Student not found');
    }

    return {
      ...result,
      tasksProgress: this.calculateTasksProgress(result.tasks),
    };
  }

  private calculateTasksProgress(tasks: Pick<Task, 'status'>[]) {
    const totalTasks = tasks.length;
    if (totalTasks === 0) return 0;

    const statusRanks = { Completed: 1, Pending: 0, Rejected: 0.25, 'Under Review': 0.5 };

    const totalProgress = tasks.reduce((acc, task) => {
      return acc + (statusRanks[task.status] || 0);
    }, 0);

    const progressPercentage = (totalProgress / totalTasks) * 100;

    return progressPercentage.toFixed(2);
  }

  async getDashboardStats(supervisorId: number) {
    try {
      this.logger.log(`Fetching dashboard stats for supervisor ID: ${supervisorId}`);

      // Execute queries in parallel for better performance
      const [totalStudentsResult, taskStatusCounts, projectStatusCounts, projectSummary, taskSummary, tasksMetrics, projectsMetrics] = await Promise.all([
        // Get total students in one query
        this.drizzle.db.select({ totalStudents: count() }).from(students).where(eq(students.supervisorId, supervisorId)),

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
          columns: {
            id: true,
            title: true,
            status: true,
            updatedAt: true,
          },
          with: {
            student: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                matricNumber: true,
              },
            },
          },
          orderBy: (projects, { desc }) => [desc(projects.updatedAt)],
          limit: 6,
        }),

        // Task summary
        this.drizzle.db.query.tasks.findMany({
          where: eq(tasks.supervisorId, supervisorId),
          columns: {
            id: true,
            task: true,
            description: true,
            status: true,
            updatedAt: true,
          },
          with: {
            student: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                matricNumber: true,
              },
            },
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
        if (item.status === 'Completed') tasksStatus.completed = Number(item.count);
        if (item.status === 'Rejected') tasksStatus.rejected = Number(item.count);
        if (item.status === 'Under Review') tasksStatus.underReview = Number(item.count);
      });

      // Process project status counts into the expected format
      const projectsStatus = {
        notStarted: 0,
        inProgress: 0,
        completed: 0,
      };

      projectStatusCounts.forEach((item) => {
        if (item.status === 'Not Started') projectsStatus.notStarted = Number(item.count);
        if (item.status === 'In Progress') projectsStatus.inProgress = Number(item.count);
        if (item.status === 'Completed') projectsStatus.completed = Number(item.count);
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
      this.logger.error(`Error fetching dashboard stats for supervisor ${supervisorId}:`, error);
      throw error;
    }
  }

  private async getTasksMetrics(supervisorId: number): Promise<Record<string, Array<Record<string, number>>>> {
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
      .where(and(eq(tasks.supervisorId, supervisorId), sql`${tasksStatusUpdate.createdAt} >= ${sixMonthsAgo.toISOString()}`))
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
        // Use Object.prototype.hasOwnProperty.call to avoid linter error
        if (Object.prototype.hasOwnProperty.call(monthlyData[monthKey][0], update.status)) {
          monthlyData[monthKey][0][update.status] = Number(update.count);
        }
      }
    });

    return monthlyData;
  }

  private async getProjectsMetrics(supervisorId: number): Promise<Record<string, Array<Record<string, number>>>> {
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
      .where(and(eq(projects.supervisorId, supervisorId), sql`${projectStatusUpdate.createdAt} >= ${sixMonthsAgo.toISOString()}`))
      .groupBy(sql`to_char(${projectStatusUpdate.createdAt}, 'YYYY-MM')`, projectStatusUpdate.status)
      .orderBy(sql`to_char(${projectStatusUpdate.createdAt}, 'YYYY-MM')`);

    // Process the results into the required format
    const monthlyData: Record<string, Array<Record<string, number>>> = {};
    const months = this.getLast6MonthsNames();

    // Initialize each month with empty data
    months.forEach((month) => {
      monthlyData[month] = [{ 'Not Started': 0, 'In Progress': 0, Completed: 0 }];
    });

    // Fill in the data from query results
    projectUpdates.forEach((update) => {
      const monthKey = this.getMonthNameFromDbFormat(update.month as string);
      if (monthlyData[monthKey] && update.status) {
        // Use Object.prototype.hasOwnProperty.call to avoid linter error
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

  async assignTaskToAllStudents(supervisorId: number, taskName: string, description: string, dueDate: Date) {
    const studentsList = await this.drizzle.db.query.students.findMany({
      where: eq(students.supervisorId, supervisorId),
      columns: { id: true },
    });

    if (!studentsList.length) {
      throw new NotFoundException('No students found for this supervisor');
    }

    const tasksToInsert = studentsList.map((student) => ({
      studentId: student.id,
      supervisorId,
      task: taskName,
      description,
      dueDate,
      status: 'Pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await this.drizzle.db.insert(tasks).values(tasksToInsert);

    for (const student of studentsList) {
      await this.notificationsService.createNotification(
        student.id,
        'student',
        NotificationType.TASK_ASSIGNED,
        'New Task Assigned',
        `You have been assigned a new task: "${taskName}". Due date: ${dueDate.toDateString()}`,
      );
    }

    return { message: `Task: ${taskName} assigned to all students under supervisor ${supervisorId}` };
  }

  async getAllAssignedTasks(supervisorId: number) {
    return this.drizzle.db.query.tasks.findMany({
      where: eq(tasks.supervisorId, supervisorId),
      columns: {
        id: true,
        task: true,
        description: true,
        status: true,
        studentId: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
      with: {
        student: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            matricNumber: true,
          },
        },
      },
    });
  }

  async getAllProjects() {
    const result = await this.drizzle.db.query.projects.findMany({
      where: and(eq(projects.status, 'Completed'), sql`${projects.finalProjectLink} IS NOT NULL AND ${projects.finalProjectLink} <> ''`),
      orderBy: (projects, { desc }) => [desc(projects.updatedAt)],
      with: {
        student: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            matricNumber: true,
          },
        },
        supervisor: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return result.map((project) => ({
      ...project,
      supervisorName: project.supervisor ? `${project.supervisor.firstName} ${project.supervisor.lastName}` : null,
      finalProjectLink: project.finalProjectLink,
    }));
  }
}
