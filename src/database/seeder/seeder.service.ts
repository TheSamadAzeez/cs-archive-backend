import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from '../drizzle.service';
import * as schema from '../schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);
  constructor(private readonly drizzle: DrizzleService) {}

  async seed() {
    await this.seedSupervisors();
    await this.seedStudents();
  }

  async seedSupervisors() {
    const SUPERVISORS = [
      {
        email: 'prof.smith@university.edu',
        lastname: 'Smith',
        firstname: 'John',
        role: 'supervisor',
      },
      {
        email: 'prof.johnson@university.edu',
        lastname: 'Johnson',
        firstname: 'Emily',
        role: 'supervisor',
      },
      {
        email: 'prof.williams@university.edu',
        lastname: 'Williams',
        firstname: 'Robert',
        role: 'supervisor',
      },
    ];

    for (const supervisorData of SUPERVISORS) {
      const existingSupervisor =
        await this.drizzle.db.query.supervisor.findFirst({
          where: eq(schema.supervisor.email, supervisorData.email),
        });

      if (!existingSupervisor) {
        this.logger.log(
          `Inserting supervisor: ${supervisorData.firstname} ${supervisorData.lastname}`,
        );
        await this.drizzle.db.insert(schema.supervisor).values(supervisorData);
      } else {
        this.logger.log(
          `Skipping supervisor: ${supervisorData.firstname} ${supervisorData.lastname} (already exists)`,
        );
      }
    }
  }

  async seedStudents() {
    // First, get all supervisors to distribute students among them
    const supervisors = await this.drizzle.db.query.supervisor.findMany();

    if (supervisors.length === 0) {
      this.logger.error('No supervisors found. Please seed supervisors first.');
      return;
    }

    const STUDENTS = [
      {
        matricNumber: 'CS2023001',
        lastName: 'Johnson',
        firstName: 'Michael',
        email: 'michael.johnson@student.edu',
        supervisorId: supervisors[0].id,
      },
      {
        matricNumber: 'CS2023002',
        lastName: 'Williams',
        firstName: 'Emma',
        email: 'emma.williams@student.edu',
        supervisorId: supervisors[1].id,
      },
      {
        matricNumber: 'CS2023003',
        lastName: 'Brown',
        firstName: 'James',
        email: 'james.brown@student.edu',
        supervisorId: supervisors[2].id,
      },
      {
        matricNumber: 'CS2023004',
        lastName: 'Jones',
        firstName: 'Olivia',
        email: 'olivia.jones@student.edu',
        supervisorId: supervisors[0].id,
      },
      {
        matricNumber: 'CS2023005',
        lastName: 'Davis',
        firstName: 'William',
        email: 'william.davis@student.edu',
        supervisorId: supervisors[1].id,
      },
      {
        matricNumber: 'CS2023006',
        lastName: 'Miller',
        firstName: 'Sophia',
        email: 'sophia.miller@student.edu',
        supervisorId: supervisors[2].id,
      },
      {
        matricNumber: 'CS2023007',
        lastName: 'Wilson',
        firstName: 'Benjamin',
        email: 'benjamin.wilson@student.edu',
        supervisorId: supervisors[0].id,
      },
      {
        matricNumber: 'CS2023008',
        lastName: 'Moore',
        firstName: 'Isabella',
        email: 'isabella.moore@student.edu',
        supervisorId: supervisors[1].id,
      },
      {
        matricNumber: 'CS2023009',
        lastName: 'Taylor',
        firstName: 'Mason',
        email: 'mason.taylor@student.edu',
        supervisorId: supervisors[2].id,
      },
      {
        matricNumber: 'CS2023010',
        lastName: 'Anderson',
        firstName: 'Charlotte',
        email: 'charlotte.anderson@student.edu',
        supervisorId: supervisors[0].id,
      },
      {
        matricNumber: 'CS2023011',
        lastName: 'Thomas',
        firstName: 'Elijah',
        email: 'elijah.thomas@student.edu',
        supervisorId: supervisors[1].id,
      },
      {
        matricNumber: 'CS2023012',
        lastName: 'Jackson',
        firstName: 'Amelia',
        email: 'amelia.jackson@student.edu',
        supervisorId: supervisors[2].id,
      },
    ];

    // Insert students directly with their data
    for (const student of STUDENTS) {
      const existingStudent = await this.drizzle.db.query.students.findFirst({
        where: eq(schema.students.matricNumber, student.matricNumber),
      });

      if (!existingStudent) {
        this.logger.log(
          `Inserting student: ${student.firstName} ${student.lastName}`,
        );
        await this.drizzle.db.insert(schema.students).values(student);
      } else {
        this.logger.log(
          `Skipping student: ${student.firstName} ${student.lastName} (already exists)`,
        );
      }
    }
  }
}
