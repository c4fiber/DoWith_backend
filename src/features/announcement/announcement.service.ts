import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Announcement } from 'src/entities/announcement.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectRepository(Announcement)
    private readonly annoRepo: Repository<Announcement>
  ){}

  async getAllAnnouncements(): Promise<{ result }>{ 
    const result = await this.annoRepo.find({
      select: [
        'anno_id'
      , 'title'
      , 'content'
      , 'anno_img'
      , 'reg_at'
      ],
      order: { reg_at: 'DESC' }
    });

    Logger.debug(result);

    return { result };
  }
}
