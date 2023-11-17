import { Body, Controller, Delete, Get, Logger, Param, Post } from '@nestjs/common';
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
    this.logger.debug("createGroupDto", JSON.stringify(createGroupDto));

    return this.groupService.createGroupOne(createGroupDto);
  }

  @Get('/:group_id')
  getGroupOne(@Param('group_id') group_id: number){
    this.logger.debug("group_id", group_id);

    return this.groupService.getGroupOne(group_id);
  }

  @Get('/:group_id/user')
  getAllMemberInGroup(@Param('group_id') group_id: number){
    this.logger.debug("group_id", group_id);

    return this.groupService.getAllMemberInGroup(group_id);
  }

  @Get('/:group_id/user/:user_id')
  getMemberTodoInGroup(
    @Param('group_id') group_id: number,
    @Param('user_id') user_id: number
  ){
    this.logger.debug("group_id", group_id);
    this.logger.debug("user_id", user_id);

    return this.groupService.getMemberTodoInGroup(group_id, user_id);
  }

  // 그룹 인원수가 0이되면 삭제
  @Delete('/:group_id')
  deleteGroup(@Param('group_id')group_id : number){
    this.logger.debug("group_id", group_id);

    return this.groupService.deleteGroup(group_id);
  }
}