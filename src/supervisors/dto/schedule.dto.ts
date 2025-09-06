import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsDateString, IsOptional, Matches, IsIn } from 'class-validator';

export class CreateScheduleDto {
  @ApiProperty({
    description: 'The title of the schedule event',
    example: 'Project Review Meeting',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'The start date of the schedule event',
    example: '2024-01-15',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'The start time of the schedule event in 12-hour format (HH:MM)',
    example: '09:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(0?[1-9]|1[0-2]):[0-5][0-9]$/, {
    message: 'Start time must be in 12-hour format (01-12):MM',
  })
  startTime: string;

  @ApiProperty({
    description: 'Period for start time (AM or PM)',
    example: 'AM',
    enum: ['AM', 'PM'],
  })
  @IsNotEmpty()
  @IsIn(['AM', 'PM'])
  startPeriod: 'AM' | 'PM';

  @ApiProperty({
    description: 'The end date of the schedule event',
    example: '2024-01-15',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({
    description: 'The end time of the schedule event in 12-hour format (HH:MM)',
    example: '11:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(0?[1-9]|1[0-2]):[0-5][0-9]$/, {
    message: 'End time must be in 12-hour format (01-12):MM',
  })
  endTime: string;

  @ApiProperty({
    description: 'Period for end time (AM or PM)',
    example: 'AM',
    enum: ['AM', 'PM'],
  })
  @IsNotEmpty()
  @IsIn(['AM', 'PM'])
  endPeriod: 'AM' | 'PM';

  @ApiProperty({
    description: 'Description of the schedule event',
    example: 'Monthly project review meeting with students',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Color code for the schedule event',
    example: '#3b82f6',
    default: '#3b82f6',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Color must be a valid hex color code (e.g., #3b82f6)',
  })
  color?: string;
}

export class UpdateScheduleDto {
  @ApiProperty({
    description: 'The title of the schedule event',
    example: 'Project Review Meeting',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'The start date of the schedule event',
    example: '2024-01-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'The start time of the schedule event in 12-hour format (HH:MM)',
    example: '09:00',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^(0?[1-9]|1[0-2]):[0-5][0-9]$/, {
    message: 'Start time must be in 12-hour format (01-12):MM',
  })
  startTime?: string;

  @ApiProperty({
    description: 'Period for start time (AM or PM)',
    example: 'AM',
    required: false,
    enum: ['AM', 'PM'],
  })
  @IsOptional()
  @IsIn(['AM', 'PM'])
  startPeriod?: 'AM' | 'PM';

  @ApiProperty({
    description: 'The end date of the schedule event',
    example: '2024-01-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'The end time of the schedule event in 12-hour format (HH:MM)',
    example: '11:00',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^(0?[1-9]|1[0-2]):[0-5][0-9]$/, {
    message: 'End time must be in 12-hour format (01-12):MM',
  })
  endTime?: string;

  @ApiProperty({
    description: 'Period for end time (AM or PM)',
    example: 'AM',
    required: false,
    enum: ['AM', 'PM'],
  })
  @IsOptional()
  @IsIn(['AM', 'PM'])
  endPeriod?: 'AM' | 'PM';

  @ApiProperty({
    description: 'Description of the schedule event',
    example: 'Monthly project review meeting with students',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Color code for the schedule event',
    example: '#3b82f6',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Color must be a valid hex color code (e.g., #3b82f6)',
  })
  color?: string;
}
