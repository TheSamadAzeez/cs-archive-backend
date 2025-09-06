import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class StudentLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  password: string;
}

export class SubmitTaskDto {
  @ApiProperty({
    description: 'The link to the task submission',
    example: 'https://example.com/submission-link',
  })
  @IsString()
  @IsNotEmpty()
  link: string;

  @ApiProperty({
    description: 'A short description of the task submission',
    example: 'This is a brief description of the task submission.',
  })
  @IsString()
  @IsNotEmpty()
  shortDescription: string;
}

export class CreateWorkDto {
  @ApiProperty({
    description: 'The title of the completed project',
    example: 'Student Management System',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'A detailed description of the project',
    example: 'A comprehensive web application for managing student records and academic information.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'The link to the project repository or deployment',
    example: 'https://github.com/username/project-repo',
  })
  @IsString()
  @IsNotEmpty()
  projectLink: string;
}
