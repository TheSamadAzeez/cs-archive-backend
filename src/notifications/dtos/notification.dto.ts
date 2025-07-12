import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { NotificationType } from '../notifications.service';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ example: 1, description: 'User ID associated with the notification' })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ example: 'student', description: 'Type of user (e.g., student, supervisor)' })
  @IsString()
  @IsNotEmpty()
  userType: 'student' | 'supervisor';

  @ApiProperty({ enum: NotificationType, description: 'Type of notification' })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'New Project Assigned', description: 'Title of the notification' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'You have been assigned a new project.', description: 'Message content of the notification' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ example: false, description: 'Indicates if the notification has been read', default: false })
  @IsOptional()
  @IsNumber()
  @IsOptional()
  relatedId?: number;

  @ApiProperty({ example: 'project', description: 'Type of related entity (e.g., project, task)', required: false })
  @IsString()
  @IsOptional()
  relatedType?: string;

  @ApiProperty({ example: false, description: 'Indicates if the notification is read', default: false })
  @IsOptional()
  @IsNumber()
  isRead?: boolean;
}

export class MarkReadDto {
  @ApiProperty({ example: 1, description: 'Notification ID to mark as read' })
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
