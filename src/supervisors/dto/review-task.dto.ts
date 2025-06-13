import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export enum TaskSubmissionStatus {
  Approved = 'approved',
  Rejected = 'rejected',
}

export class ReviewTaskDto {
  @ApiProperty({
    description: 'The status of the task submission',
    example: 'approved',
  })
  @IsEnum(TaskSubmissionStatus)
  @IsNotEmpty()
  status: TaskSubmissionStatus;

  @ApiProperty({
    description: 'The feedback for the task submission',
    example: 'The task submission is not good enough',
  })
  @IsString()
  @IsNotEmpty()
  feedback: string;
}

export class AssignTaskDto {
  @ApiProperty({
    description: 'The name of the task to be assigned',
    example: 'Complete the project report',
  })
  @IsString()
  @IsNotEmpty()
  taskName: string;

  @ApiProperty({
    description: 'The description of the task to be assigned',
    example: 'Prepare a detailed report on the project progress',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'The due date for the task',
    example: '2023-12-31T23:59:59.999Z',
  })
  @IsString()
  @IsNotEmpty()
  dueDate: string;
}
