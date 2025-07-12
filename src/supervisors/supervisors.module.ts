import { Module } from '@nestjs/common';
import { SupervisorsService } from './service/supervisors.service';
import { SupervisorsController } from './supervisors.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [SupervisorsController],
  providers: [SupervisorsService],
})
export class SupervisorsModule {}
