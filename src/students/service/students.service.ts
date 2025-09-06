import { Injectable, NotFoundException, Logger, ForbiddenException } from '@nestjs/common';
import { DrizzleService } from 'src/database/drizzle.service';
import { eq, count, and, sql } from 'drizzle-orm';
import { projects, students, tasks, tasksStatusUpdate, taskSubmissions, schedules } from 'src/database/schema';
import { SubmitTaskDto } from '../dtos/student.dto';
import { NotificationsService, NotificationType } from 'src/notifications/notifications.service';
import { convertTo12Hour } from 'src/shared/utils/time.utils';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly notificationsService: NotificationsService,
  ) {}

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

      // Get status counts, summary, and metrics as before
      const [taskStatusCounts, taskSummary, tasksMetrics, allTasks] = await Promise.all([
        this.drizzle.db
          .select({
            status: tasks.status,
            count: count(),
          })
          .from(tasks)
          .where(eq(tasks.studentId, studentId))
          .groupBy(tasks.status),

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

        this.getTasksMetrics(studentId),

        // Get all tasks with status, description, assigned date, and due date
        this.drizzle.db.query.tasks.findMany({
          where: eq(tasks.studentId, studentId),
          columns: {
            id: true,
            task: true,
            status: true,
            description: true,
            createdAt: true, // assigned date
            dueDate: true,
          },
          orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
        }),
      ]);

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
        tasks: allTasks,
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
      with: {
        taskSubmissions: {
          columns: {
            id: true,
            link: true,
            shortDescription: true,
            status: true,
            feedback: true,
            createdAt: true,
            updatedAt: true,
          },
          where: eq(taskSubmissions.studentId, studentId),
        },
      },
      orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
    });
  }

  async submitTask(studentId: number, taskId: number, submitTaskDto: SubmitTaskDto) {
    // Fetch the task and ensure it belongs to the student and is pending
    const task = await this.drizzle.db.query.tasks.findFirst({
      where: and(eq(tasks.id, taskId), eq(tasks.studentId, studentId), eq(tasks.status, 'Pending')),
    });

    if (!task) {
      throw new NotFoundException('Pending task not found for this student');
    }

    // Create a submission entry
    const submission = await this.drizzle.db
      .insert(taskSubmissions)
      .values({
        taskId,
        studentId,
        supervisorId: task.supervisorId,
        link: submitTaskDto.link,
        shortDescription: submitTaskDto.shortDescription,
        status: 'pending',
        feedback: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await this.drizzle.db.update(tasks).set({ status: 'Under Review', updatedAt: new Date() }).where(eq(tasks.id, taskId));

    const project = await this.drizzle.db.query.projects.findFirst({
      where: eq(projects.studentId, studentId),
    });

    if (project && project.status === 'Not Started') {
      await this.drizzle.db
        .update(projects)
        .set({
          status: 'In Progress',
          updatedAt: new Date(),
        })
        .where(eq(projects.id, project.id));
    }

    await this.notificationsService.createNotification(
      task.supervisorId,
      'supervisor',
      NotificationType.TASK_SUBMITTED,
      'New Task Submission',
      `A student has submitted a task for review: ${task.task}`,
      taskId,
      'task',
    );
    return { message: 'Task submitted successfully', submission };
  }

  async getStudentProject(studentId: number) {
    // Fetch student, project, supervisor, and all tasks
    const student = await this.drizzle.db.query.students.findFirst({
      where: eq(students.id, studentId),
      with: {
        project: {
          columns: {
            id: true,
            title: true,
            description: true,
            status: true,
            supervisorId: true,
          },
          with: {
            supervisor: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!student || !student.project) {
      throw new NotFoundException('Project not found for this student');
    }

    // Fetch all tasks for the student
    const allTasks = await this.drizzle.db.query.tasks.findMany({
      where: eq(tasks.studentId, studentId),
      columns: {
        id: true,
        task: true,
        status: true,
        description: true,
        updatedAt: true, // completed date
      },
      orderBy: (tasks, { desc }) => [desc(tasks.updatedAt)],
    });

    // Calculate percentage of completed tasks
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === 'Completed').length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Prepare task history
    const taskHistory = allTasks.map((task) => ({
      task: task.task,
      description: task.description,
      completedDate: task.status === 'Completed' ? task.updatedAt : null,
      status: task.status,
    }));

    // Prepare supervisor name
    const supervisor = student.project.supervisor;
    const supervisorName = supervisor ? `${supervisor.firstName} ${supervisor.lastName}` : null;

    return {
      studentName: `${student.firstName} ${student.lastName}`,
      matricNumber: student.matricNumber,
      email: student.email,
      projectTitle: student.project.title,
      projectDescription: student.project.description,
      supervisor: supervisorName,
      projectStatus: student.project.status,
      completionPercentage,
      taskHistory,
    };
  }

  async submitProject(studentId: number, finalProjectLink: string) {
    // Get all tasks for the student
    const tasksList = await this.drizzle.db.query.tasks.findMany({
      where: eq(tasks.studentId, studentId),
      columns: { status: true },
    });

    // Check if there are exactly 5 tasks and all are completed
    if (tasksList.length !== 5 || tasksList.some((task) => task.status !== 'Completed')) {
      throw new ForbiddenException('You can only submit your project when all 5 tasks are completed.');
    }

    // Find the student's project
    const project = await this.drizzle.db.query.projects.findFirst({
      where: eq(projects.studentId, studentId),
    });
    if (!project) {
      throw new NotFoundException('Project not found for this student');
    }

    // Update the project with the final link and set status to Completed
    const [updatedProject] = await this.drizzle.db
      .update(projects)
      .set({
        finalProjectLink,
        status: 'Completed',
        updatedAt: new Date(),
      })
      .where(eq(projects.id, project.id))
      .returning();

    return updatedProject;
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

  async getSupervisorSchedules(studentId: number) {
    // First, get the student's supervisor ID
    const student = await this.drizzle.db.query.students.findFirst({
      where: eq(students.id, studentId),
      columns: {
        supervisorId: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (!student.supervisorId) {
      throw new NotFoundException('No supervisor assigned to this student');
    }

    // Get all schedules created by the student's supervisor
    const supervisorSchedules = await this.drizzle.db.query.schedules.findMany({
      where: eq(schedules.supervisorId, student.supervisorId),
      orderBy: (schedules, { asc }) => [asc(schedules.startDate), asc(schedules.startTime)],
      with: {
        supervisor: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
          },
        },
      },
    });

    return supervisorSchedules.map((schedule) => {
      const startTime12 = convertTo12Hour(schedule.startTime);
      const endTime12 = convertTo12Hour(schedule.endTime);

      return {
        id: schedule.id,
        title: schedule.title,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        description: schedule.description,
        color: schedule.color,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
        // 24-hour format
        startTime24: schedule.startTime,
        endTime24: schedule.endTime,
        // 12-hour format
        startTime12: startTime12.display,
        endTime12: endTime12.display,
        startTimeParts: {
          time: startTime12.time,
          period: startTime12.period,
        },
        endTimeParts: {
          time: endTime12.time,
          period: endTime12.period,
        },
        supervisor: {
          id: schedule.supervisor.id,
          name: schedule.supervisor.fullName,
          firstName: schedule.supervisor.firstName,
          lastName: schedule.supervisor.lastName,
        },
      };
    });
  }
}
