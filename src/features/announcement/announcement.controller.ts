import { Controller, Get } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';

@Controller('announcement')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Get('/')
  getAllAnnouncements(): Promise<{ result }>{
    return this.announcementService.getAllAnnouncements();
  }
}
