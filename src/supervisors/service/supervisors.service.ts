import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from 'src/database/drizzle.service';
import { projects, students } from 'src/database/schema';
import { eq } from 'drizzle-orm';
import { tasks } from 'src/database/schema/tasks.schema';

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
        taskName: task.name,
        description: task.description,
        status: task.status,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      })),
    }));
  }
}
