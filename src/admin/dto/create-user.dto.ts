import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';

export class CreateSupervisorDto {
  @ApiProperty({
    description: 'The first name of the supervisor',
    example: 'John',
    required: true,
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'The last name of the supervisor',
    example: 'Doe',
    required: true,
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'The email of the supervisor',
    example: 'johndoe@gmail.com',
    required: true,
    minLength: 5,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  email: string;
}

export class CreateStudentDto {
  @ApiProperty({
    description: 'The first name of the student',
    example: 'Jane',
    required: true,
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'The last name of the student',
    example: 'Smith',
    required: true,
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'The matriculation number of the student',
    example: '123456789',
    required: true,
    minLength: 5,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  matricNumber: string;

  @ApiProperty({
    description: 'The email of the student',
    example: 'janesmith@gmail.com',
    required: true,
    minLength: 5,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'The ID of the supervisor assigned to the student',
    example: 1,
    required: false,
  })
  @IsString()
  @IsNotEmpty({ message: 'Supervisor ID is optional but should be a number if provided.' })
  supervisorId?: number;

  @ApiProperty({
    description: 'The title of the project assigned to the student',
    example: 'AI Research Project',
    required: false,
  })
  @IsString()
  @IsNotEmpty({ message: 'Project title is optional but should be a string if provided.' })
  projectTitle: string;

  @ApiProperty({
    description: 'The description of the project assigned to the student',
    example: 'This project involves researching AI algorithms.',
    required: false,
  })
  @IsString()
  @IsNotEmpty({ message: 'Project description is optional but should be a string if provided.' })
  projectDescription: string;
}

export class DeleteByIdDto {
  @ApiProperty({ example: '123' })
  @IsNotEmpty()
  @IsNumberString()
  id: string;
}

export class UpdateStudentDto {
  @ApiProperty({
    description: 'The ID of the student',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumberString()
  id: number;

  @ApiProperty({
    description: 'The first name of the student',
    example: 'Jane',
    required: true,
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'The last name of the student',
    example: 'Smith',
    required: true,
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'The matriculation number of the student',
    example: '123456789',
    required: true,
    minLength: 5,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  matricNumber: string;

  @ApiProperty({
    description: 'The email of the student',
    example: 'janesmith@gmail.com',
    required: true,
    minLength: 5,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'The ID of the supervisor assigned to the student',
    example: 1,
    required: false,
  })
  @IsString()
  @IsNotEmpty({ message: 'Supervisor ID is optional but should be a number if provided.' })
  supervisorId?: number;
}
