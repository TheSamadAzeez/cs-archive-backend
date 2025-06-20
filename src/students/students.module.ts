import { Module } from '@nestjs/common';
import { StudentsService } from './service/students.service';
import { StudentsController } from './students.controller';

@Module({
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}
