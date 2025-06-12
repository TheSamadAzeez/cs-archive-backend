import { Module } from '@nestjs/common';
import { SupervisorsService } from './service/supervisors.service';
import { SupervisorsController } from './supervisors.controller';

@Module({
  controllers: [SupervisorsController],
  providers: [SupervisorsService],
})
export class SupervisorsModule {}
