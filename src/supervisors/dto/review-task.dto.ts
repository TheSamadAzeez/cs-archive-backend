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
