import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthStudentService } from './services/auth-student.service';
import { TokenService } from './services/token.service';
import { DrizzleModule } from 'src/database/drizzle.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthSupervisorService } from './services/auth-supervisor.service';

@Module({
  imports: [
    DrizzleModule,
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_ACCESS_EXPIRATION') },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthStudentService, AuthSupervisorService, TokenService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthStudentService, TokenService],
})
export class AuthModule {}
