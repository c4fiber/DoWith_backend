import { Body, Controller, Delete, Get, Logger, Param, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { GroupService } from './group.service';
import { Group } from './entities/group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { MulterConfig } from 'src/utils/fileUpload/MulterConfigService';
import { PagingOptions } from 'src/utils/paging/PagingOptions';

@Controller('group')
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly multerConifg: MulterConfig
  ){
    this.multerConifg.changePath(process.env.IMAGE_PATH);
  }
  
  // 모든 그룹 조회
  @Get('/')
  getGroupAll(
    @PagingOptions() pagingOptions: { page: number; limit: number }
  ){
    return this.groupService.getGroupAll(pagingOptions);
  }

  // 그룹 생성
  @Post('')
  createGroupOne(
    @Body('grpInfo') createGroupDto: CreateGroupDto,
    @Body('routInfo') routs: Array<any>
  ): Promise<any>{
    return this.groupService.createGroupOne(createGroupDto, routs);
  }

  // 그룹 상세조회
  @Get('/:grp_id')
  getGroupOne(@Param('grp_id') grp_id: number){
    return this.groupService.getGroupOne(grp_id);
  }

  // 내가 속한 그룹 조회
  @Get('/:user_id/groups')
  getAllMyGroups(
      @Param('user_id') user_id: number
    , @PagingOptions() pagingOptions: { page: number; limit: number }
  ){
    return this.groupService.getAllMyGroups(user_id, pagingOptions);
  }

  // 그룹 가입하기
  @Post('/:grp_id/join/:user_id')
  createJoinGroup(
    @Param('grp_id')grp_id: number,
    @Param('user_id')user_id: number
  ): Promise<any> {
    return this.groupService.createJoinGroup(grp_id, user_id);
  }

  // 그룹 나가기
  @Delete('/:grp_id/left/:user_id')
  leftGroup(
    @Param('grp_id')grp_id: number,
    @Param('user_id')user_id: number
  ): Promise<any>{
    return this.groupService.leftGroup(grp_id, user_id);
  }

  // 그룹원들의 인증 사진 조회
  @Get('/:grp_id/user/:user_id/image')
  getMemberTodoInGroup (
    @Param('grp_id') grp_id: number,
    @Param('user_id') user_id: number
  ): Promise<any>{
    return this.groupService.getMemberTodoInGroup(grp_id, user_id);
  }

  // 검색 - 카테고리, 검색어 이용
  @Get('/search/:user_id/:category/:keyword?')
  getGroupsBySearching(
    @Param('user_id') user_id: number,
    @Param('category') cat_id: number,
    @Param('keyword') keyword: string,
    @PagingOptions() pagingOptions: { page: number; limit: number }
  ): Promise<{ result: Group[], total: number}>{
    return this.groupService.getGroupsBySearching(user_id, cat_id, keyword, pagingOptions);
  }
  
  @UseInterceptors(FileInterceptor('file'))
  @Patch('/:todo_id/user/:user_id/image')
  updateImage(
    @Param('todo_id') todo_id: number,
    @Param('user_id') user_id: number,
    @UploadedFile() file: Express.Multer.File
  ): Promise<any>{
    return this.groupService.updateImage(todo_id, user_id, file);
  }

  // 그룹원 할 일 인증 승인
  @Patch('/user/:todo_id/approve')
  updateTodoDone(
    @Param('todo_id') todo_id: number
  ): Promise<any>{
    return this.groupService.updateTodoDone(todo_id);
  }

  // 그룹 삭제 (인원수가 0이되면 삭제)
  @Delete('/:grp_id')
  deleteGroup(@Param('grp_id')grp_id : number){
    return this.groupService.deleteGroup(grp_id);
  }
}