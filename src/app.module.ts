import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StudentsController } from './students/students.controller';
import { StudentsService } from './students/service/students.service';
import { SupervisorsController } from './supervisors/supervisors.controller';
import { SupervisorsService } from './supervisors/service/supervisors.service';
import { StudentsModule } from './students/students.module';
import { SupervisorsModule } from './supervisors/supervisors.module';
import { AuthModule } from './auth/auth.module';
import { DrizzleModule } from './database/drizzle.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    StudentsModule,
    SupervisorsModule,
    AuthModule,
    DrizzleModule.forRootAsync(),
  ],
  controllers: [AppController, StudentsController, SupervisorsController],
  providers: [AppService, StudentsService, SupervisorsService],
})
export class AppModule {}
