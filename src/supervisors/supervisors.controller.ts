import { Body, Controller, Get, Param, Patch, Post, UseGuards, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Role, Roles } from 'src/auth/decorators/roles.decorators';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { SupervisorsService } from './service/supervisors.service';
import { AssignTaskDto, ReviewTaskDto } from './dto/review-task.dto';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/schedule.dto';
import { NotificationsService } from 'src/notifications/notifications.service';

@ApiTags('Supervisors')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('supervisors')
export class SupervisorsController {
  constructor(
    private readonly supervisorsService: SupervisorsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Roles(Role.Supervisor)
  @Get('/students')
  async getStudents(@CurrentUser('userId') supervisorId: number) {
    return this.supervisorsService.getStudents(supervisorId);
  }

  @Roles(Role.Supervisor)
  @Get('/students/:studentId')
  async getStudentById(@CurrentUser('userId') supervisorId: number, @Param('studentId') studentId: number) {
    return this.supervisorsService.getStudentById(supervisorId, studentId);
  }

  @Roles(Role.Supervisor)
  @Get('/students/:studentId/tasks')
  async getStudentTasks(@CurrentUser('userId') supervisorId: number, @Param('studentId') studentId: number) {
    return this.supervisorsService.getStudentTasks(supervisorId, studentId);
  }

  @Roles(Role.Supervisor)
  @Get('/students/:studentId/tasks/:taskId')
  async getStudentTask(@CurrentUser('userId') supervisorId: number, @Param('studentId') studentId: number, @Param('taskId') taskId: number) {
    return this.supervisorsService.getStudentTask(supervisorId, studentId, taskId);
  }

  @Roles(Role.Supervisor)
  @Post('/students/:studentId/tasks/:taskId/review')
  async reviewTask(@CurrentUser('userId') supervisorId: number, @Param('studentId') studentId: number, @Param('taskId') taskId: number, @Body() reviewTaskDto: ReviewTaskDto) {
    return this.supervisorsService.reviewTask(supervisorId, studentId, taskId, reviewTaskDto);
  }

  @Roles(Role.Supervisor)
  @Get('/dashboard-stats')
  async getDashboardStats(@CurrentUser('userId') supervisorId: number) {
    return this.supervisorsService.getDashboardStats(supervisorId);
  }

  @Roles(Role.Supervisor)
  @Post('/assign-task')
  async assignTaskToAllStudents(@CurrentUser('userId') supervisorId: number, @Body() assignTaskDto: AssignTaskDto) {
    return this.supervisorsService.assignTaskToAllStudents(supervisorId, assignTaskDto.taskName, assignTaskDto.description, new Date(assignTaskDto.dueDate));
  }

  @Roles(Role.Supervisor)
  @Get('/all-projects')
  async getAllProjects() {
    return this.supervisorsService.getAllProjects();
  }

  @Roles(Role.Supervisor)
  @Get('/assigned-tasks')
  async getAllAssignedTasks(@CurrentUser('userId') supervisorId: number) {
    return this.supervisorsService.getAllAssignedTasks(supervisorId);
  }

  @Roles(Role.Supervisor)
  @Get('/notifications')
  async getNotifications(@CurrentUser('userId') supervisorId: number) {
    return this.notificationsService.getNotifications(supervisorId, 'supervisor');
  }

  @Roles(Role.Supervisor)
  @Patch('/notifications/:id/read')
  async markNotificationAsRead(@CurrentUser('userId') supervisorId: number, @Param('id') notificationId: number) {
    return this.notificationsService.markAsRead(notificationId, supervisorId);
  }

  @Roles(Role.Supervisor)
  @Get('/notifications/unread-count')
  async getUnreadCount(@CurrentUser('userId') supervisorId: number) {
    const count = await this.notificationsService.getUnreadCount(supervisorId, 'supervisor');
    return { unreadCount: count };
  }

  // Schedule Management Routes
  @Roles(Role.Supervisor)
  @Post('/schedules')
  @ApiOperation({ summary: 'Create a new schedule event' })
  @ApiResponse({ status: 201, description: 'Schedule created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createSchedule(@CurrentUser('userId') supervisorId: number, @Body() createScheduleDto: CreateScheduleDto) {
    return this.supervisorsService.createSchedule(supervisorId, createScheduleDto);
  }

  @Roles(Role.Supervisor)
  @Get('/schedules')
  @ApiOperation({ summary: 'Get all schedules for the supervisor' })
  @ApiResponse({ status: 200, description: 'Schedules retrieved successfully' })
  async getSchedules(@CurrentUser('userId') supervisorId: number) {
    return this.supervisorsService.getSchedules(supervisorId);
  }

  @Roles(Role.Supervisor)
  @Get('/schedules/:id')
  @ApiOperation({ summary: 'Get a specific schedule by ID' })
  @ApiResponse({ status: 200, description: 'Schedule retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async getScheduleById(@CurrentUser('userId') supervisorId: number, @Param('id') scheduleId: number) {
    return this.supervisorsService.getScheduleById(supervisorId, scheduleId);
  }

  @Roles(Role.Supervisor)
  @Patch('/schedules/:id')
  @ApiOperation({ summary: 'Update a specific schedule' })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async updateSchedule(@CurrentUser('userId') supervisorId: number, @Param('id') scheduleId: number, @Body() updateScheduleDto: UpdateScheduleDto) {
    return this.supervisorsService.updateSchedule(supervisorId, scheduleId, updateScheduleDto);
  }

  @Roles(Role.Supervisor)
  @Delete('/schedules/:id')
  @ApiOperation({ summary: 'Delete a specific schedule' })
  @ApiResponse({ status: 200, description: 'Schedule deleted successfully' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async deleteSchedule(@CurrentUser('userId') supervisorId: number, @Param('id') scheduleId: number) {
    return this.supervisorsService.deleteSchedule(supervisorId, scheduleId);
  }
}
