import { HttpStatus, Injectable } from '@nestjs/common';

export class DoWithException extends Error {
  name: string;
  errorCode: number;
  statusCode: number;

  constructor(message, errorCode, statusCode) {
    super(message);
    this.name = 'DoWithException';
    this.errorCode = errorCode;
    this.statusCode = statusCode;
  }

  getStatus() {
    return this.statusCode;
  }
}

enum DoWithErrorCode {
  // User
  UserAlreadyExists = '0011',
  UserNotFound = '0012',
  UserNameNotUnique = '0013',
  SelfFriendship = '0014',

  // Group
  FailedToleftGroup = '0100',
  FailedToMakeGroup = '0101',

  // Routine
  ExceedMaxRoutines = '0200',
}

enum DoWithErrorMsg {
  // User
  UserAlreadyExists = 'User is already registerd',
  UserNotFound = 'User not found',
  UserNameNotUnique = 'User name is not unique',
  SelfFriendship = 'A user cannot befriend themselves',

  // Group
  FailedToleftGroup = '그룹을 나가는데 실패 했습니다.',
  FailedToMakeGroup = '그룹을 생성하는데 실패 했습니다.',

  // Routine
  ExceedMaxRoutines = '등록할 수 있는 최대 루틴을 초과하셨습니다.',
}

@Injectable()
export class DoWithExceptions {
  // =============== [ User ] ===============
  UserAlreadyExists = new DoWithException(
    DoWithErrorMsg.UserAlreadyExists,
    DoWithErrorCode.UserAlreadyExists,
    HttpStatus.BAD_REQUEST,
  );
  UserNotFound = new DoWithException(
    DoWithErrorMsg.UserNotFound,
    DoWithErrorCode.UserNotFound,
    HttpStatus.BAD_REQUEST,
  );
  UserNameNotUnique = new DoWithException(
    DoWithErrorMsg.UserNameNotUnique,
    DoWithErrorCode.UserNameNotUnique,
    HttpStatus.BAD_REQUEST,
  );
  SelfFriendship = new DoWithException(
    DoWithErrorMsg.SelfFriendship,
    DoWithErrorMsg.SelfFriendship,
    HttpStatus.BAD_REQUEST,
  );

  // =============== [ Group ] ===============
  FailedToleftGroup = new DoWithException(
    DoWithErrorMsg.FailedToleftGroup,
    DoWithErrorCode.FailedToleftGroup,
    HttpStatus.BAD_REQUEST,
  );

  FailedToMakeGroup = new DoWithException(
    DoWithErrorMsg.FailedToMakeGroup,
    DoWithErrorCode.FailedToMakeGroup,
    HttpStatus.BAD_REQUEST,
  );
  
  // =============== [ Routine ] ===============
  ExceedMaxRoutines = new DoWithException(
    DoWithErrorMsg.ExceedMaxRoutines,
    DoWithErrorCode.ExceedMaxRoutines,
    HttpStatus.BAD_REQUEST,
  );
}
