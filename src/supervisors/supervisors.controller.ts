import { Controller, Get, UseGuards } from '@nestjs/common';
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
  async getStudentsBySupervisor(@CurrentUser('userId') userId: number) {
    return this.supervisorsService.getStudentsBySupervisor(userId);
  }

  @Roles(Role.Supervisor)
  @Get('/dashboard-stats')
  async getDashboardStats(@CurrentUser('userId') userId: number) {
    return this.supervisorsService.getDashboardStats(userId);
  }
}
