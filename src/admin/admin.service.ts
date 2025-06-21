import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DrizzleService } from 'src/database/drizzle.service';
import { projects, students, supervisor } from 'src/database/schema';
import { CreateStudentDto, CreateSupervisorDto, UpdateStudentDto } from './dto/create-user.dto';

@Injectable()
export class AdminService {
  constructor(private readonly drizzle: DrizzleService) {}

  // Get all students with their supervisors and projects
  async getAllStudents() {
    const studentsList = await this.drizzle.db.query.students.findMany({
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        matricNumber: true,
        email: true,
      },
      with: {
        supervisor: {
          columns: {
            firstName: true,
            lastName: true,
          },
        },
        project: {
          columns: {
            title: true,
          },
        },
      },
      orderBy: (students, { asc }) => [asc(students.lastName)],
    });

    return studentsList.map((student) => ({
      ...student,
      supervisorName: student.supervisor ? `${student.supervisor.firstName} ${student.supervisor.lastName}` : null,
      projectTitle: student.project ? student.project.title : null,
      status: student.supervisor ? 'assigned' : 'unassigned',
    }));
  }

  async getAllStudentsWithSupervisors() {
    const students = await this.drizzle.db.query.students.findMany({
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        matricNumber: true,
        email: true,
      },
      with: {
        supervisor: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return students.map((student) => ({
      ...student,
      supervisorName: student.supervisor ? `${student.supervisor.firstName} ${student.supervisor.lastName}` : null,
      status: student.supervisor ? 'assigned' : 'unassigned',
    }));
  }

  // Get all supervisors
  async getAllSupervisors() {
    return this.drizzle.db.query.supervisor.findMany();
  }

  async getStudentsWithSupervisor() {
    return this.drizzle.db.query.students.findMany({
      where: sql`${students.supervisorId} IS NOT NULL`,
    });
  }

  async getStudentsWithoutSupervisor() {
    return this.drizzle.db.query.students.findMany({
      where: sql`${students.supervisorId} IS NULL`,
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
        where: sql`${students.supervisorId} IS NOT NULL`,
      }),
      this.drizzle.db.query.students.findMany({
        where: sql`${students.supervisorId} IS NULL`,
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
      supervisorId: Number(dto.supervisorId) || null, // Ensure supervisorId is a number or null
    };
    const [student] = await this.drizzle.db.insert(students).values(studentData).returning();

    if (!student) {
      throw new Error('Failed to create student');
    }

    await this.drizzle.db.insert(projects).values({
      title: dto.projectTitle,
      description: dto.projectDescription,
      startDate: new Date(),
      studentId: student.id,
      supervisorId: student.supervisorId,
    });

    // Fetch with supervisor and project info
    const fullStudent = await this.drizzle.db.query.students.findFirst({
      where: eq(students.id, student.id),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        matricNumber: true,
        email: true,
      },
      with: {
        supervisor: {
          columns: {
            firstName: true,
            lastName: true,
          },
        },
        project: {
          columns: {
            title: true,
          },
        },
      },
    });

    return {
      ...fullStudent,
      supervisorName: fullStudent?.supervisor ? `${fullStudent.supervisor.firstName} ${fullStudent.supervisor.lastName}` : null,
      projectTitle: fullStudent?.project ? fullStudent.project.title : null,
      status: fullStudent?.supervisor ? 'assigned' : 'unassigned',
    };
  }

  async updateStudent(id: number, dto: UpdateStudentDto) {
    await this.drizzle.db
      .update(students)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();

    // Fetch with supervisor and project info
    const fullStudent = await this.drizzle.db.query.students.findFirst({
      where: eq(students.id, id),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        matricNumber: true,
        email: true,
      },
      with: {
        supervisor: {
          columns: {
            firstName: true,
            lastName: true,
          },
        },
        project: {
          columns: {
            title: true,
          },
        },
      },
    });

    return {
      ...fullStudent,
      supervisorName: fullStudent?.supervisor ? `${fullStudent.supervisor.firstName} ${fullStudent.supervisor.lastName}` : null,
      projectTitle: fullStudent?.project ? fullStudent.project.title : null,
      status: fullStudent?.supervisor ? 'assigned' : 'unassigned',
    };
  }

  async deleteStudent(id: number) {
    const deletedStudent = await this.drizzle.db.delete(students).where(eq(students.id, id)).returning();
    await this.drizzle.db.update(students).set({ deletedAt: new Date() }).where(eq(students.id, id));
    return deletedStudent;
  }

  async deleteSupervisor(id: number) {
    const deletedSupervisor = await this.drizzle.db.delete(supervisor).where(eq(supervisor.id, id)).returning();
    await this.drizzle.db.update(supervisor).set({ deletedAt: new Date() }).where(eq(supervisor.id, id));
    return deletedSupervisor;
  }
}
