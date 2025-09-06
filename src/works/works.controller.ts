import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';
import { WorksService } from './works.service';

@ApiTags('Works')
@Controller('works')
export class WorksController {
  constructor(private readonly worksService: WorksService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all completed projects in the archive (public access)' })
  @ApiResponse({ status: 200, description: 'All works retrieved successfully' })
  async getAllWorks() {
    return await this.worksService.getAllWorks();
  }
}
