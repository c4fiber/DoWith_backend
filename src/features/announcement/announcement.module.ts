import { Module } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { AnnouncementController } from './announcement.controller';
import { Announcement } from 'src/entities/announcement.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Announcement]),
],
  controllers: [AnnouncementController],
  providers: [AnnouncementService],
})
export class AnnouncementModule {}
