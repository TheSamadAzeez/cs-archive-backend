import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role, Roles } from 'src/auth/decorators/roles.decorators';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { StudentsService } from './service/students.service';
import { SubmitTaskDto } from './dtos/student.dto';
import { NotificationsService } from 'src/notifications/notifications.service';

@ApiTags('Students')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Roles(Role.Student)
  @Get('/tasks/completed')
  async getCompletedTasks(@CurrentUser('userId') studentId: number) {
    return this.studentsService.getCompletedTasks(studentId);
  }

  @Roles(Role.Student)
  @Get('/tasks/pending')
  async getPendingTasks(@CurrentUser('userId') studentId: number) {
    return this.studentsService.getPendingTasks(studentId);
  }

  @Roles(Role.Student)
  @Get('/tasks/rejected')
  async getRejectedTasks(@CurrentUser('userId') studentId: number) {
    return this.studentsService.getRejectedTasks(studentId);
  }

  @Roles(Role.Student)
  @Get('/tasks/under-review')
  async getUnderReviewTasks(@CurrentUser('userId') studentId: number) {
    return this.studentsService.getUnderReviewTasks(studentId);
  }

  @Roles(Role.Student)
  @Get('/dashboard-stats')
  async getDashboardStats(@CurrentUser('userId') studentId: number) {
    return this.studentsService.getDashboardStats(studentId);
  }

  @Roles(Role.Student)
  @Get('/tasks')
  async getAllTasks(@CurrentUser('userId') studentId: number) {
    return this.studentsService.getAllTasks(studentId);
  }

  @Roles(Role.Student)
  @Post('/tasks/:taskId/submit')
  async submitTask(@CurrentUser('userId') studentId: number, @Param('taskId') taskId: number, @Body() submitTaskDto: SubmitTaskDto) {
    return this.studentsService.submitTask(studentId, Number(taskId), submitTaskDto);
  }

  @Roles(Role.Student)
  @Get('/project')
  async getStudentProject(@CurrentUser('userId') studentId: number) {
    return this.studentsService.getStudentProject(studentId);
  }

  @Roles(Role.Student)
  @Post('/submit-project')
  async submitProject(@CurrentUser('userId') studentId: number, @Body('finalProjectLink') finalProjectLink: string) {
    return this.studentsService.submitProject(studentId, finalProjectLink);
  }

  @Roles(Role.Student)
  @Get('/all-projects')
  async getAllProjects() {
    return this.studentsService.getAllProjects();
  }

  @Roles(Role.Student)
  @Get('/notifications')
  async getNotifications(@CurrentUser('userId') studentId: number) {
    return this.notificationsService.getNotifications(studentId, 'student');
  }

  @Roles(Role.Student)
  @Patch('/notifications/:id/read')
  async markNotificationAsRead(@CurrentUser('userId') studentId: number, @Param('id') notificationId: number) {
    return this.notificationsService.markAsRead(notificationId, studentId);
  }

  @Roles(Role.Student)
  @Get('/notifications/unread-count')
  async getUnreadCount(@CurrentUser('userId') studentId: number) {
    const count = await this.notificationsService.getUnreadCount(studentId, 'student');
    return { unreadCount: count };
  }
}
