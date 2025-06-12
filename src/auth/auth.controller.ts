import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthStudentService } from './services/auth-student.service';
import { RefreshTokenDto, StudentLoginDto, SupervisorLoginDto } from './dtos/student-auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from './decorators/roles.decorators';
import { Role } from './decorators/roles.decorators';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthSupervisorService } from './services/auth-supervisor.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authStudentService: AuthStudentService,
    private readonly authSupervisorService: AuthSupervisorService,
  ) {}

  @ApiOperation({ summary: 'Student login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @Post('student/login')
  async login(@Body() studentLoginDto: StudentLoginDto) {
    return this.authStudentService.login(studentLoginDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Student)
  @Get('refresh-token')
  async refreshAccessToken(@Req() req: any) {
    const refreshToken = req.headers['authorization']?.split(' ')[1];
    if (!refreshToken) {
      throw new Error('Refresh token not provided');
    }
    return this.authStudentService.refreshAccessToken(refreshToken);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout student' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @UseGuards(AuthGuard('jwt'))
  @Roles(Role.Student)
  @Post('student/logout')
  async logout(@Body() body: RefreshTokenDto) {
    return this.authStudentService.revokeRefreshToken(body.token);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Login supervisor' })
  @ApiResponse({ status: 200, description: 'Supervisor login successful' })
  @Post('supervisor/login')
  async loginSupervisor(@Body() supervisorLoginDto: SupervisorLoginDto) {
    return this.authSupervisorService.loginSupervisor(supervisorLoginDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout student' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @UseGuards(AuthGuard('jwt'))
  @Roles(Role.Supervisor)
  @Post('supervisor/logout')
  async logoutSupervisor(@Body() body: RefreshTokenDto) {
    return this.authStudentService.revokeRefreshToken(body.token);
  }
}
