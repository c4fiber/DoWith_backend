import { Body, Controller, Delete, Get, Logger, Param, Patch, Post } from '@nestjs/common';
import { GroupService } from './group.service';
import { Group } from './entities/group.entity';
import { CreateGroupDto } from './dto/create-group.dto';

@Controller('group')
export class GroupController {
  constructor(
    private readonly logger: Logger,
    private readonly groupService: GroupService
  ){}
  
  // 모든 그룹 조회
  @Get('/')
  getGroupAll(): Promise<Group[]>{
    return this.groupService.getGroupAll();
  }

  // 그룹 생성
  @Post('/:user_id')
  createGroupOne(
    @Param('user_id') user_id: number,
    @Body() createGroupDto: CreateGroupDto
  ): Promise<any>{
    this.logger.debug("createGroupDto", JSON.stringify(createGroupDto));

    return this.groupService.createGroupOne(user_id, createGroupDto);
  }

  // 그룹 상세조회
  @Get('/:grp_id')
  getGroupOne(@Param('grp_id') grp_id: number){
    this.logger.debug("grp_id", grp_id);

    return this.groupService.getGroupOne(grp_id);
  }

  // 내가 속한 그룹 조회
  @Get('/:user_id/groups')
  getAllMyGroups(@Param('user_id') user_id: number){
    this.logger.debug("user_id", user_id);

    return this.groupService.getAllMyGroups(user_id);
  }

  // 그룹 가입하기
  @Post('/:grp_id/join/:user_id')
  createJoinGroup(
    @Param('grp_id')grp_id: number,
    @Param('user_id')user_id: number
  ): Promise<any> {
    this.logger.debug("grp_id", grp_id);
    this.logger.debug("user_id", user_id);
    
    return this.groupService.createJoinGroup(grp_id, user_id);
  }

  // 그룹 나가기
  @Delete('/:grp_id/left/:user_id')
  leftGroup(
    @Param('grp_id')grp_id: number,
    @Param('user_id')user_id: number
  ): Promise<any>{
    this.logger.debug("grp_id", grp_id);
    this.logger.debug("user_id", user_id);

    return this.groupService.leftGroup(grp_id, user_id);
  }

  // 그룹원들의 인증 사진 조회
  @Get('/:grp_id/user/:user_id/image')
  getMemberTodoInGroup (
    @Param('grp_id') grp_id: number,
    @Param('user_id') user_id: number
  ): Promise<any[]>{
    this.logger.debug("grp_id", grp_id);
    this.logger.debug("user_id", user_id);

    return this.groupService.getMemberTodoInGroup(grp_id, user_id);
  }

  // 검색 - 카테고리, 검색어 이용
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
  
  // @Patch()
  // updateImg()

  // 그룹 삭제 (인원수가 0이되면 삭제)
  @Delete('/:grp_id')
  deleteGroup(@Param('grp_id')grp_id : number){
    this.logger.debug("grp_id", grp_id);

    return this.groupService.deleteGroup(grp_id);
  }
}