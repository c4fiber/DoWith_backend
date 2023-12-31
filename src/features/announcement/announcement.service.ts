import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Announcement } from 'src/entities/announcement.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectRepository(Announcement)
    private readonly annoRepo: Repository<Announcement>
  ){}

  async getAllAnnouncements(): Promise<{ result: any[], total: number }>{ 
    const result = await this.annoRepo.find({
      select: [
        'anno_id'
      , 'title'
      , 'reg_at'
      ],
      order: { reg_at: 'DESC' }
    });

    return { result, total: result.length };
  }

  async getAnnouncementDetail(anno_id: number): Promise<{ result }> {
    const result = await this.annoRepo.findOne({
      select: [
        'title'
      , 'content'
      , 'anno_img'
      , 'reg_at'
      ],
      where: {
        anno_id
      }
    });

    return { result };
  }
}
