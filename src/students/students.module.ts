import { Module } from '@nestjs/common';
import { StudentsService } from './service/students.service';
import { StudentsController } from './students.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}
