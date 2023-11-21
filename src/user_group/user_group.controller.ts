import { Controller } from '@nestjs/common';
import { UserGroupService } from './user_group.service';

@Controller('user-group')
export class UserGroupController {
  constructor(private readonly userGroupService: UserGroupService) {}
}
