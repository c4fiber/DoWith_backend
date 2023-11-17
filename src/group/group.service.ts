import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { Any, In, Repository } from 'typeorm';
import { CreateGroupDto } from './dto/create-group.dto';
import { User } from 'src/user/user.entities';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    private readonly logger: Logger
  ){}

  async getGroupAll(): Promise<Group[]>{
    return await this.groupRepository.find();
  }

  async createGroupOne(createGroupDto: CreateGroupDto): Promise<Group>{
    // 빈칸으로 삽입되는거 막아지지가 않네? Entity, Dto 다 시도해 봤는데?
    return await this.groupRepository.save(createGroupDto);
  }

  async getGroupOne(group_id: number): Promise<Group>{
    return await this.groupRepository.findOneBy({group_id});
  }

  async getAllMemberInGroup(group_id: number): Promise<Promise<Group[]>>{
    const result = await this.groupRepository.createQueryBuilder('group')
                                             .leftJoinAndSelect('group.users', 'user')
                                             .where('group.group_id = :group_id', {group_id})
                                             .getMany();
    this.logger.debug(result);
    return result;
  }

  async getMemberTodoInGroup(group_id: number, user_id: number){
    return {"success": true};
  }

  async deleteGroup(group_id: number){
    return await this.groupRepository.softDelete({group_id});
  }
}
