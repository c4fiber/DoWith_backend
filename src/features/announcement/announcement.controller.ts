import { Controller, Get, Param } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';

@Controller('announcement')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Get('/')
  getAllAnnouncements(): Promise<{ result: any[] }>{
    return this.announcementService.getAllAnnouncements();
  }

  @Get('/:anno_id')
  getAnnouncementDetail(
    @Param('anno_id') anno_id: number
  ): Promise<{ result }>{
    return this.announcementService.getAnnouncementDetail(anno_id);
  }
}
