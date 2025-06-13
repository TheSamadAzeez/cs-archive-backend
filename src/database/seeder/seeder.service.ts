import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../drizzle.service';
import * as schema from '../schema';
import { ProjectStatus } from '../schema/projects.schema';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);
  constructor(private readonly drizzle: DrizzleService) {}

  async seed() {
    await this.seedSupervisors();
    await this.seedStudents();
    await this.seedProjects();
    await this.seedTasks();
    await this.seedProjectStatusUpdates();
    await this.seedTaskStatusUpdates();
  }

  async seedSupervisors() {
    const SUPERVISORS = [
      { email: 'prof.smith@university.edu', lastname: 'Smith', firstname: 'John', role: 'supervisor' },
      { email: 'prof.johnson@university.edu', lastname: 'Johnson', firstname: 'Emily', role: 'supervisor' },
      { email: 'prof.williams@university.edu', lastname: 'Williams', firstname: 'Robert', role: 'supervisor' },
    ];

    for (const supervisorData of SUPERVISORS) {
      const existingSupervisor = await this.drizzle.db.query.supervisor.findFirst({
        where: eq(schema.supervisor.email, supervisorData.email),
      });

      if (!existingSupervisor) {
        this.logger.log(`Inserting supervisor: ${supervisorData.firstname} ${supervisorData.lastname}`);
        await this.drizzle.db.insert(schema.supervisor).values(supervisorData);
      } else {
        this.logger.log(`Skipping supervisor: ${supervisorData.firstname} ${supervisorData.lastname} (already exists)`);
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
      { matricNumber: 'CS2023001', lastName: 'Johnson', firstName: 'Michael', email: 'michael.johnson@student.edu', supervisorId: supervisors[0].id },
      { matricNumber: 'CS2023002', lastName: 'Williams', firstName: 'Emma', email: 'emma.williams@student.edu', supervisorId: supervisors[1].id },
      { matricNumber: 'CS2023003', lastName: 'Brown', firstName: 'James', email: 'james.brown@student.edu', supervisorId: supervisors[2].id },
      { matricNumber: 'CS2023004', lastName: 'Jones', firstName: 'Olivia', email: 'olivia.jones@student.edu', supervisorId: supervisors[0].id },
      { matricNumber: 'CS2023005', lastName: 'Davis', firstName: 'William', email: 'william.davis@student.edu', supervisorId: supervisors[1].id },
      { matricNumber: 'CS2023006', lastName: 'Miller', firstName: 'Sophia', email: 'sophia.miller@student.edu', supervisorId: supervisors[2].id },
      { matricNumber: 'CS2023007', lastName: 'Wilson', firstName: 'Benjamin', email: 'benjamin.wilson@student.edu', supervisorId: supervisors[0].id },
      { matricNumber: 'CS2023008', lastName: 'Moore', firstName: 'Isabella', email: 'isabella.moore@student.edu', supervisorId: supervisors[1].id },
      { matricNumber: 'CS2023009', lastName: 'Taylor', firstName: 'Mason', email: 'mason.taylor@student.edu', supervisorId: supervisors[2].id },
      { matricNumber: 'CS2023010', lastName: 'Anderson', firstName: 'Charlotte', email: 'charlotte.anderson@student.edu', supervisorId: supervisors[0].id },
      { matricNumber: 'CS2023011', lastName: 'Thomas', firstName: 'Elijah', email: 'elijah.thomas@student.edu', supervisorId: supervisors[1].id },
      { matricNumber: 'CS2023012', lastName: 'Jackson', firstName: 'Amelia', email: 'amelia.jackson@student.edu', supervisorId: supervisors[2].id },
    ];

    // Insert students directly with their data
    for (const student of STUDENTS) {
      const existingStudent = await this.drizzle.db.query.students.findFirst({
        where: eq(schema.students.matricNumber, student.matricNumber),
      });

      if (!existingStudent) {
        this.logger.log(`Inserting student: ${student.firstName} ${student.lastName}`);
        await this.drizzle.db.insert(schema.students).values(student);
      } else {
        this.logger.log(`Skipping student: ${student.firstName} ${student.lastName} (already exists)`);
      }
    }
  }

  async seedProjects() {
    // Get all students and supervisors
    const students = await this.drizzle.db.query.students.findMany();
    const supervisors = await this.drizzle.db.query.supervisor.findMany();

    if (students.length === 0 || supervisors.length === 0) {
      this.logger.error('No students or supervisors found. Please seed them first.');
      return;
    }

    // Project titles and descriptions for variety
    const projectTitles = [
      'Machine Learning for Disease Prediction',
      'Blockchain Implementation for Supply Chain',
      'Development of a Real-time IoT Monitoring System',
      'Natural Language Processing for Sentiment Analysis',
      'Cloud-based Distributed Computing Framework',
      'Cybersecurity Risk Assessment Tool',
      'Mobile Application for Health Tracking',
      'Web-based Collaborative Learning Platform',
      'Computer Vision for Autonomous Vehicles',
      'Quantum Computing Algorithm Implementation',
      'Sustainable Energy Management System',
      'Augmented Reality for Educational Purposes',
    ];

    const projectDescriptions = [
      'This project aims to develop a machine learning algorithm for early prediction of diseases based on patient data.',
      'Implementation of blockchain technology to enable transparent and secure tracking of supply chain processes.',
      'Creating a system for real-time monitoring and analysis of data from IoT devices deployed in various environments.',
      'Developing a natural language processing tool to analyze sentiment in social media and customer feedback.',
      'Design and implementation of a cloud-based framework to enable efficient distributed computing.',
      'Development of a comprehensive tool to assess and mitigate cybersecurity risks in organizations.',
      'Creating a mobile application that tracks health metrics and provides personalized recommendations.',
      'Building a web-based platform that facilitates collaborative learning and knowledge sharing.',
      'Implementing computer vision algorithms for object detection and tracking in autonomous vehicles.',
      'Exploring and implementing quantum computing algorithms for solving complex problems.',
      'Developing a system for efficient management and optimization of energy usage in buildings.',
      'Creating augmented reality applications to enhance learning experiences in educational settings.',
    ];

    // Generate one project for each student
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const supervisor = supervisors[i % supervisors.length];
      const titleIndex = i % projectTitles.length;

      // Check if project already exists
      const existingProject = await this.drizzle.db.query.projects.findFirst({
        where: eq(schema.projects.studentId, student.id),
      });

      if (!existingProject) {
        // Create project with random status and start date
        const statuses: ProjectStatus[] = ['Not Started', 'In Progress', 'Completed'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        // Generate start date within the last year
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 12));

        this.logger.log(`Inserting project for student: ${student.firstName} ${student.lastName}`);

        await this.drizzle.db.insert(schema.projects).values({
          title: projectTitles[titleIndex],
          description: projectDescriptions[titleIndex],
          status: status,
          startDate: startDate,
          supervisorId: supervisor.id,
          studentId: student.id,
        });
      } else {
        this.logger.log(`Skipping project for student: ${student.firstName} ${student.lastName} (already exists)`);
      }
    }
  }

  async seedTasks() {
    // Get all students and supervisors
    const students = await this.drizzle.db.query.students.findMany();
    const supervisors = await this.drizzle.db.query.supervisor.findMany();

    if (students.length === 0 || supervisors.length === 0) {
      this.logger.error('No students or supervisors found. Please seed them first.');
      return;
    }

    // Task templates for variety
    const taskTemplates = [
      {
        task: 'Literature Review',
        description: 'Research and review existing literature related to the project topic.',
      },
      {
        task: 'Project Proposal',
        description: 'Develop a detailed proposal outlining the project objectives, methodology, and timeline.',
      },
      {
        task: 'Data Collection',
        description: 'Collect relevant data required for the project analysis.',
      },
      {
        task: 'Preliminary Analysis',
        description: 'Conduct preliminary analysis of the collected data to identify patterns and insights.',
      },
      {
        task: 'Implementation',
        description: 'Implement the proposed solution or methodology.',
      },
      {
        task: 'Testing and Validation',
        description: 'Test the implemented solution and validate its performance.',
      },
      {
        task: 'Progress Report',
        description: 'Prepare a report detailing the progress made so far and challenges encountered.',
      },
      {
        task: 'Final Documentation',
        description: 'Prepare comprehensive documentation of the entire project.',
      },
    ];

    const statuses = ['Pending', 'Under Review', 'Completed', 'Rejected'];

    // Generate 3-5 tasks for each student
    for (const student of students) {
      // Find supervisor for this student
      const supervisor = supervisors.find((sup) => sup.id === student.supervisorId);

      if (!supervisor) continue;

      // Random number of tasks per student (3-5)
      const numTasks = Math.floor(Math.random() * 3) + 3;

      // Check if student already has tasks
      const existingTasks = await this.drizzle.db.query.tasks.findMany({
        where: eq(schema.tasks.studentId, student.id),
      });

      if (existingTasks.length === 0) {
        this.logger.log(`Creating ${numTasks} tasks for student: ${student.firstName} ${student.lastName}`);

        // Generate tasks for this student
        for (let i = 0; i < numTasks; i++) {
          const templateIndex = i % taskTemplates.length;
          const template = taskTemplates[templateIndex];

          // Random status
          const status = statuses[Math.floor(Math.random() * statuses.length)];

          // Due date within the next 3 months
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 90) + 1);

          await this.drizzle.db.insert(schema.tasks).values({
            task: template.task,
            description: template.description,
            dueDate: dueDate,
            status: status,
            studentId: student.id,
            supervisorId: supervisor.id,
          });
        }
      } else {
        this.logger.log(`Skipping tasks for student: ${student.firstName} ${student.lastName} (already has tasks)`);
      }
    }
  }

  async seedProjectStatusUpdates() {
    // Get all projects
    const allProjects = await this.drizzle.db.query.projects.findMany({
      with: {
        student: true,
        supervisor: true,
      },
    });

    if (allProjects.length === 0) {
      this.logger.error('No projects found. Please seed projects first.');
      return;
    }

    // Check if status updates already exist
    const existingUpdates = await this.drizzle.db.query.projectStatusUpdate.findMany({
      limit: 1,
    });

    if (existingUpdates.length > 0) {
      this.logger.log('Project status updates already exist. Skipping seeding of project status updates.');
      return;
    }

    this.logger.log('Creating project status updates...');

    // For each project, create 2-4 status updates
    for (const project of allProjects) {
      const numUpdates = Math.floor(Math.random() * 3) + 2; // 2-4 updates
      const statuses: ProjectStatus[] = ['Not Started', 'In Progress', 'Completed'];

      // Get initial status based on project's current status
      let currentStatusIndex = statuses.indexOf(project.status);
      if (currentStatusIndex === -1) currentStatusIndex = 0;

      // Create updates that show progression over time
      for (let i = 0; i <= currentStatusIndex && i < numUpdates; i++) {
        const status = statuses[i];

        // Create timestamp that's progressively more recent (older to newer)
        const createdAt = new Date(project.startDate);
        createdAt.setDate(createdAt.getDate() + i * 14); // Every two weeks

        await this.drizzle.db.insert(schema.projectStatusUpdate).values({
          projectId: project.id,
          status: status,
          createdAt: createdAt,
        });
      }
    }

    this.logger.log('Project status updates created successfully.');
  }

  async seedTaskStatusUpdates() {
    // Get all tasks
    const allTasks = await this.drizzle.db.query.tasks.findMany({
      with: {
        student: true,
        supervisor: true,
      },
    });

    if (allTasks.length === 0) {
      this.logger.error('No tasks found. Please seed tasks first.');
      return;
    }

    // Check if status updates already exist
    const existingUpdates = await this.drizzle.db.query.tasksStatusUpdate.findMany({
      limit: 1,
    });

    if (existingUpdates.length > 0) {
      this.logger.log('Task status updates already exist. Skipping seeding of task status updates.');
      return;
    }

    this.logger.log('Creating task status updates...');

    // For each task, create 1-3 status updates
    for (const task of allTasks) {
      const numUpdates = Math.floor(Math.random() * 3) + 1; // 1-3 updates
      const statuses = ['Pending', 'Under Review', 'Completed', 'Rejected'];

      // Get index of current status
      let currentStatusIndex = statuses.indexOf(task.status);
      if (currentStatusIndex === -1) currentStatusIndex = 0;

      // Create updates that show progression over time
      for (let i = 0; i <= currentStatusIndex && i < numUpdates; i++) {
        // Skip last status if it's rejected and we're not at the end
        if (i < currentStatusIndex && statuses[i] === 'Rejected') continue;

        const status = statuses[i];

        // Create timestamp that's progressively more recent (older to newer)
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - (numUpdates - i) * 7); // 7 days apart

        await this.drizzle.db.insert(schema.tasksStatusUpdate).values({
          taskId: task.id,
          status: status,
          createdAt: createdAt,
        });
      }
    }

    this.logger.log('Task status updates created successfully.');
  }
}
