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
