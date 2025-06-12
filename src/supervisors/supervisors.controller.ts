import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role, Roles } from 'src/auth/decorators/roles.decorators';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { SupervisorsService } from './service/supervisors.service';

@ApiTags('Supervisors')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('supervisors')
export class SupervisorsController {
  constructor(private readonly supervisorsService: SupervisorsService) {}

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
  @Get('/dashboard-stats')
  async getDashboardStats(@CurrentUser('userId') supervisorId: number) {
    return this.supervisorsService.getDashboardStats(supervisorId);
  }
}
