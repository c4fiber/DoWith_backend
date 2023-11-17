import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { GroupService } from './group.service';
import { Group } from './entities/group.entity';
import { CreateGroupDto } from './dto/create-group.dto';

@Controller('group')
export class GroupController {
  constructor(
    private readonly logger: Logger,
    private readonly groupService: GroupService
  ){}

  @Get('/')
  getGroupAll(): Promise<Group[]>{
    return this.groupService.getGroupAll();
  }

  @Post('/')
  createGroupOne(@Body() createGroupDto: CreateGroupDto): Promise<Group>{
    this.logger.log("createGroupDto", JSON.stringify(createGroupDto));

    return this.groupService.createGroupOne(createGroupDto);
  }

  @Get('/:group_id')
  getGroupOne(@Param('group_id') group_id: number){
    this.logger.log("group_id", group_id);

    return this.groupService.getGroupOne(group_id);
  }

  @Get('/:group_id/user')
  getAllMemberInGroup(@Param('group_id') group_id: number){
    this.logger.log("group_id", group_id);

    return this.groupService.getAllMemberInGroup(group_id);
  }

  @Get('/:group_id/user/:user_id')
  getMemberTodoInGroup(
    @Param('group_id') group_id: number,
    @Param('user_id') user_id: number
  ){
    this.logger.log("group_id", group_id);
    this.logger.log("user_id", user_id);

    return this.groupService.getMemberTodoInGroup(group_id, user_id);
  }
}