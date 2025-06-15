import { Injectable } from '@nestjs/common';
import { eq, isNull } from 'drizzle-orm';
import { DrizzleService } from 'src/database/drizzle.service';
import { projects, students, supervisor } from 'src/database/schema';
import { CreateStudentDto, CreateSupervisorDto } from './dto/create-user.dto';

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

  async getDashboardStats() {
    // Get all counts in parallel for efficiency
    const [studentsList, supervisorsList, assignedStudentsList, unassignedStudentsList, completedProjectsList, inProgressProjectsList, notStartedProjectsList] = await Promise.all([
      this.drizzle.db.query.students.findMany(),
      this.drizzle.db.query.supervisor.findMany(),
      this.drizzle.db.query.students.findMany({
        where: (students) => isNull(students.supervisorId),
      }),
      this.drizzle.db.query.students.findMany({
        where: (students) => isNull(students.supervisorId),
      }),
      this.drizzle.db.query.projects.findMany({
        where: (projects) => eq(projects.status, 'Completed'),
      }),
      this.drizzle.db.query.projects.findMany({
        where: (projects) => eq(projects.status, 'In Progress'),
      }),
      this.drizzle.db.query.projects.findMany({
        where: (projects) => eq(projects.status, 'Not Started'),
      }),
    ]);

    return {
      totalStudents: studentsList.length,
      totalSupervisors: supervisorsList.length,
      assignedStudents: assignedStudentsList.length,
      unassignedStudents: unassignedStudentsList.length,
      completedProjects: completedProjectsList.length,
      inProgressProjects: inProgressProjectsList.length,
      notStartedProjects: notStartedProjectsList.length,
    };
  }

  async addSupervisor(dto: CreateSupervisorDto) {
    const supervisors = await this.drizzle.db
      .insert(supervisor)
      .values({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        role: 'supervisor',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return supervisors;
  }

  async addStudent(dto: CreateStudentDto) {
    const studentData: any = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      matricNumber: dto.matricNumber,
      email: dto.email,
      role: 'student',
      createdAt: new Date(),
      updatedAt: new Date(),
      supervisorId: typeof dto.supervisorId === 'number' ? dto.supervisorId : undefined,
    };
    const student = await this.drizzle.db.insert(students).values(studentData).returning();
    return student;
  }
}
