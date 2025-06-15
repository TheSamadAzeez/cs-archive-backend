import { Injectable } from '@nestjs/common';
import { eq, isNull } from 'drizzle-orm';
import { DrizzleService } from 'src/database/drizzle.service';
import { projects } from 'src/database/schema';

@Injectable()
export class AdminService {
  constructor(private readonly drizzle: DrizzleService) {}

  // Get all students
  async getAllStudents() {
    return this.drizzle.db.query.students.findMany();
  }

  // Get all supervisors
  async getAllSupervisors() {
    return this.drizzle.db.query.supervisor.findMany();
  }

  // Get students that have been assigned a supervisor
  async getStudentsWithSupervisor() {
    return this.drizzle.db.query.students.findMany({
      where: (students) => isNull(students.supervisorId),
    });
  }

  // Get students that have NOT been assigned a supervisor
  async getStudentsWithoutSupervisor() {
    return this.drizzle.db.query.students.findMany({
      where: (students) => isNull(students.supervisorId),
    });
  }

  // Get all completed projects
  async getCompletedProjects() {
    return this.drizzle.db.query.projects.findMany({
      where: eq(projects.status, 'Completed'),
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
  }

  // Get all projects in progress
  async getProjectsInProgress() {
    return this.drizzle.db.query.projects.findMany({
      where: eq(projects.status, 'In Progress'),
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
  }

  // Get all projects that haven't been started
  async getProjectsNotStarted() {
    return this.drizzle.db.query.projects.findMany({
      where: eq(projects.status, 'Not Started'),
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
  }
}
