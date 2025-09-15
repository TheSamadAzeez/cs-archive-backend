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
    await this.seedWorks();
  }

  async seedSupervisors() {
    const SUPERVISORS = [
      { email: 'prof.smith@university.edu', lastName: 'Smith', firstName: 'John', role: 'supervisor' },
      { email: 'prof.johnson@university.edu', lastName: 'Johnson', firstName: 'Emily', role: 'supervisor' },
      { email: 'prof.williams@university.edu', lastName: 'Williams', firstName: 'Robert', role: 'supervisor' },
    ];

    for (const supervisorData of SUPERVISORS) {
      const existingSupervisor = await this.drizzle.db.query.supervisor.findFirst({
        where: eq(schema.supervisor.email, supervisorData.email),
      });

      if (!existingSupervisor) {
        this.logger.log(`Inserting supervisor: ${supervisorData.firstName} ${supervisorData.lastName}`);
        await this.drizzle.db.insert(schema.supervisor).values(supervisorData);
      } else {
        this.logger.log(`Skipping supervisor: ${supervisorData.firstName} ${supervisorData.lastName} (already exists)`);
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
      { matricNumber: '210591001', lastName: 'Johnson', firstName: 'Michael', email: 'michael.johnson@student.edu', supervisorId: supervisors[0].id },
      { matricNumber: '210591002', lastName: 'Williams', firstName: 'Emma', email: 'emma.williams@student.edu', supervisorId: supervisors[1].id },
      { matricNumber: '210591003', lastName: 'Brown', firstName: 'James', email: 'james.brown@student.edu', supervisorId: supervisors[2].id },
      { matricNumber: '210591004', lastName: 'Jones', firstName: 'Olivia', email: 'olivia.jones@student.edu', supervisorId: supervisors[0].id },
      { matricNumber: '210591005', lastName: 'Davis', firstName: 'William', email: 'william.davis@student.edu', supervisorId: supervisors[1].id },
      { matricNumber: '210591006', lastName: 'Miller', firstName: 'Sophia', email: 'sophia.miller@student.edu', supervisorId: supervisors[2].id },
      { matricNumber: '210591007', lastName: 'Wilson', firstName: 'Benjamin', email: 'benjamin.wilson@student.edu', supervisorId: supervisors[0].id },
      { matricNumber: '210591008', lastName: 'Moore', firstName: 'Isabella', email: 'isabella.moore@student.edu', supervisorId: supervisors[1].id },
      { matricNumber: '210591009', lastName: 'Taylor', firstName: 'Mason', email: 'mason.taylor@student.edu', supervisorId: supervisors[2].id },
      { matricNumber: '210591010', lastName: 'Anderson', firstName: 'Charlotte', email: 'charlotte.anderson@student.edu', supervisorId: supervisors[0].id },
      { matricNumber: '210591011', lastName: 'Thomas', firstName: 'Elijah', email: 'elijah.thomas@student.edu', supervisorId: supervisors[1].id },
      { matricNumber: '210591012', lastName: 'Jackson', firstName: 'Amelia', email: 'amelia.jackson@student.edu', supervisorId: supervisors[2].id },
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

    // Example links for completed projects
    const exampleLinks = [
      'https://github.com/example/project1',
      'https://github.com/example/project2',
      'https://github.com/example/project3',
      'https://github.com/example/project4',
      'https://github.com/example/project5',
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

        // If status is 'Completed', assign a finalProjectLink
        let finalProjectLink: string | null = null;
        if (status === 'Completed') {
          // Pick a random example link
          finalProjectLink = exampleLinks[Math.floor(Math.random() * exampleLinks.length)];
        }

        this.logger.log(`Inserting project for student: ${student.firstName} ${student.lastName}`);

        await this.drizzle.db.insert(schema.projects).values({
          title: projectTitles[titleIndex],
          description: projectDescriptions[titleIndex],
          status: status,
          startDate: startDate,
          supervisorId: supervisor.id,
          studentId: student.id,
          finalProjectLink: finalProjectLink,
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

  async clearWorks() {
    this.logger.log('Clearing existing works...');
    await this.drizzle.db.delete(schema.works);
    this.logger.log('All works cleared successfully.');
  }

  async seedWorks() {
    // Get all students and supervisors
    const students = await this.drizzle.db.query.students.findMany();
    const supervisors = await this.drizzle.db.query.supervisor.findMany();

    if (students.length === 0 || supervisors.length === 0) {
      this.logger.error('No students or supervisors found. Please seed them first.');
      return;
    }

    // Clear existing works before seeding new ones
    await this.clearWorks();

    this.logger.log('Creating works (published academic projects)...');

    // Realistic academic work titles and descriptions with functional links
    const worksData = [
      {
        title: 'Machine Learning Approaches for Early Detection of Cardiovascular Disease',
        description:
          'This research explores various machine learning algorithms including Random Forest, SVM, and Neural Networks for early prediction of cardiovascular disease using patient health metrics. The study achieved 87% accuracy using ensemble methods and provides a comprehensive comparison of different ML approaches.',
        projectLink: 'https://github.com/microsoft/ML-For-Beginners',
      },
      {
        title: 'Blockchain-Based Supply Chain Management System for Agricultural Products',
        description:
          'An innovative blockchain implementation designed to create transparency and traceability in agricultural supply chains. The system tracks products from farm to consumer, ensuring authenticity and reducing fraud in the agricultural sector.',
        projectLink: 'https://github.com/ethereum/go-ethereum',
      },
      {
        title: 'Real-Time IoT Data Processing Platform for Smart Cities',
        description:
          'A comprehensive IoT platform that collects, processes, and analyzes sensor data from various urban infrastructure components. The system handles traffic monitoring, air quality assessment, and energy consumption optimization in real-time.',
        projectLink: 'https://github.com/apache/kafka',
      },
      {
        title: 'Natural Language Processing for Automated Document Classification',
        description:
          'Development of an NLP system that automatically classifies legal documents using transformer-based models. The system achieves 92% accuracy in categorizing contracts, agreements, and legal briefs, significantly reducing manual processing time.',
        projectLink: 'https://github.com/huggingface/transformers',
      },
      {
        title: 'Cloud-Native Microservices Architecture for E-commerce Platforms',
        description:
          'Design and implementation of a scalable microservices architecture deployed on Kubernetes. The system handles user management, product catalog, order processing, and payment services with high availability and fault tolerance.',
        projectLink: 'https://github.com/kubernetes/kubernetes',
      },
      {
        title: 'Cybersecurity Threat Detection Using Deep Learning',
        description:
          'A deep learning-based intrusion detection system that identifies network anomalies and potential security threats. The system uses LSTM networks to analyze network traffic patterns and achieve 94% accuracy in threat detection.',
        projectLink: 'https://github.com/tensorflow/tensorflow',
      },
      {
        title: 'Mobile Health Application for Diabetes Management',
        description:
          'A cross-platform mobile application that helps diabetic patients monitor blood glucose levels, track medication, and receive personalized health recommendations. The app integrates with wearable devices and provides real-time health insights.',
        projectLink: 'https://github.com/facebook/react-native',
      },
      {
        title: 'Web-Based Collaborative Learning Platform with AI Tutoring',
        description:
          'An interactive online learning platform that incorporates AI-powered tutoring systems. The platform provides personalized learning paths, automated assessment, and intelligent content recommendations for enhanced educational outcomes.',
        projectLink: 'https://github.com/microsoft/vscode',
      },
      {
        title: 'Computer Vision for Autonomous Vehicle Navigation',
        description:
          'Implementation of computer vision algorithms for object detection, lane recognition, and obstacle avoidance in autonomous vehicles. The system uses convolutional neural networks and achieves real-time processing for safe navigation.',
        projectLink: 'https://github.com/opencv/opencv',
      },
      {
        title: 'Quantum Algorithm Implementation for Optimization Problems',
        description:
          'Research and implementation of quantum algorithms for solving complex optimization problems. The work focuses on quantum annealing and variational quantum eigensolver algorithms with applications in logistics and resource allocation.',
        projectLink: 'https://github.com/Qiskit/qiskit',
      },
      {
        title: 'Renewable Energy Management System Using IoT and Machine Learning',
        description:
          'An intelligent energy management system that optimizes renewable energy consumption in smart buildings. The system uses IoT sensors and machine learning algorithms to predict energy demand and optimize solar panel efficiency.',
        projectLink: 'https://github.com/home-assistant/core',
      },
      {
        title: 'Augmented Reality Educational Tool for Interactive Learning',
        description:
          'Development of an AR application that enhances traditional classroom learning with interactive 3D models and simulations. The tool covers subjects like chemistry, physics, and biology with immersive educational experiences.',
        projectLink: 'https://github.com/google-ar/arcore-unity-sdk',
      },
    ];

    // Create works for a subset of students (those who have completed projects)
    const completedProjects = await this.drizzle.db.query.projects.findMany({
      where: eq(schema.projects.status, 'Completed'),
      with: {
        student: true,
        supervisor: true,
      },
    });

    let workIndex = 0;
    for (const project of completedProjects) {
      if (workIndex >= worksData.length) break;

      const workData = worksData[workIndex];

      // Check if work already exists for this student
      const existingWork = await this.drizzle.db.query.works.findFirst({
        where: eq(schema.works.studentId, project.studentId),
      });

      if (!existingWork) {
        this.logger.log(`Creating work for student: ${project.student.firstName} ${project.student.lastName}`);

        await this.drizzle.db.insert(schema.works).values({
          title: workData.title,
          description: workData.description,
          projectLink: workData.projectLink,
          supervisorId: project.supervisorId,
          studentId: project.studentId,
        });

        workIndex++;
      } else {
        this.logger.log(`Skipping work for student: ${project.student.firstName} ${project.student.lastName} (already exists)`);
      }
    }

    // If we have more works data than completed projects, create additional works
    // by distributing remaining works among available students and supervisors
    if (workIndex < worksData.length) {
      const remainingWorks = worksData.slice(workIndex);
      let studentIndex = 0;

      for (const workData of remainingWorks) {
        if (studentIndex >= students.length) break;

        const student = students[studentIndex];
        const supervisor = supervisors[studentIndex % supervisors.length];

        // Check if work already exists for this student
        const existingWork = await this.drizzle.db.query.works.findFirst({
          where: eq(schema.works.studentId, student.id),
        });

        if (!existingWork) {
          this.logger.log(`Creating additional work for student: ${student.firstName} ${student.lastName}`);

          await this.drizzle.db.insert(schema.works).values({
            title: workData.title,
            description: workData.description,
            projectLink: workData.projectLink,
            supervisorId: supervisor.id,
            studentId: student.id,
          });
        }

        studentIndex++;
      }
    }

    this.logger.log('Works seeded successfully.');
  }

  async reseedWorks() {
    this.logger.log('Reseeding works...');
    await this.seedWorks();
    this.logger.log('Works reseeded successfully.');
  }
}
