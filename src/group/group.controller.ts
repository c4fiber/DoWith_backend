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
  createGroupOne(@Body() createGroupDto: CreateGroupDto): Promise<any>{
    this.logger.debug("createGroupDto", JSON.stringify(createGroupDto));

    return this.groupService.createGroupOne(createGroupDto);
  }

  @Get('/:grp_id')
  getGroupOne(@Param('grp_id') grp_id: number){
    this.logger.debug("grp_id", grp_id);

    return this.groupService.getGroupOne(grp_id);
  }

  @Get('/:user_id/groups')
  getAllMyGroup(@Param('user_id') user_id: number){
    this.logger.debug("user_id", user_id);

    return this.groupService.getAllMyGroup(user_id);
  }

  @Get('/:grp_id/user/:user_id')
  getMemberTodoInGroup (
    @Param('grp_id') grp_id: number,
    @Param('user_id') user_id: number
  ): Promise<any[]>{
    this.logger.debug("grp_id", grp_id);
    this.logger.debug("user_id", user_id);

    return this.groupService.getMemberTodoInGroup(grp_id, user_id);
  }

  @Get('/search/:user_id/:category/:keyword?')
  getGroupsBySearching(
    @Param('user_id') user_id: number,
    @Param('category') cat_id: number,
    @Param('keyword') keyword: string
  ): Promise<any[]>{
    this.logger.debug("user_id = ", user_id);
    this.logger.debug("category = ", cat_id);
    this.logger.debug("keyword = ", keyword);

    return this.groupService.getGroupsBySearching(user_id, cat_id, keyword);
  }

  // 그룹 인원수가 0이되면 삭제
  @Delete('/:grp_id')
  deleteGroup(@Param('grp_id')grp_id : number){
    this.logger.debug("grp_id", grp_id);

    return this.groupService.deleteGroup(grp_id);
  }
}