import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class StudentLoginDto {
  @ApiProperty({
    description: 'The matriculation number of the student',
    example: '210591001',
  })
  @IsString()
  @IsNotEmpty()
  matricNumber: string;

  @ApiProperty({
    description: 'The password of the student',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName: string;
}

export class StudentDto {
  @IsString()
  @IsNotEmpty()
  matricNumber: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsBoolean()
  @IsNotEmpty()
  active: boolean;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'The refresh token to be used for generating a new access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class SupervisorLoginDto {
  @ApiProperty({
    description: 'The email address of the supervisor',
    example: 'john@gmail.com',
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'The password of the supervisor',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName: string;
}

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@example.com', description: 'Admin email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Doe', description: 'Admin surname (last name)' })
  @IsNotEmpty()
  lastName: string;
}
