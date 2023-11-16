import { Controller, Get, Logger, Post } from '@nestjs/common';

@Controller('group')
export class GroupController {
  constructor(
    private readonly logger: Logger
  ){}

  @Get('/')
  getGroupAll(){
    this.logger.log("This is getGroupAll method");
    return 'hello';
  }

  @Post('/')
  createGroupOne(){
    this.logger.log("This is createGroupOne method");
    return 'hello';
  }

  @Get('/:group_id')
  getGroupOne(){
    this.logger.log("This is getGroupOne method");
    return 'hello';
  }

  @Get('/:group_id/user')
  getAllMemberInGroup(){
    this.logger.log("This is getAllMemberInGroup method");
    return 'hello';
  }

  @Get('/:group_id/user/:user_id')
  getMemberTodoInGroup(){
    this.logger.log("This is getMemberTodoInGroup method");
    return 'hello';
  }
}
