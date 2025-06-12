import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SupervisorsService } from './service/supervisors.service';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { Role } from 'src/auth/decorators/roles.decorators';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Supervisors')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('supervisors')
export class SupervisorsController {
  constructor(private readonly supervisorsService: SupervisorsService) {}

  @Roles(Role.Supervisor)
  @Get(':id/students')
  async getStudentsBySupervisor(@Param('id') id: number) {
    return this.supervisorsService.getStudentsBySupervisor(id);
  }
}
