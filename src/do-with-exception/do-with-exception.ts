import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

export class DoWithException extends HttpException {
  private errCode: string;

  constructor(message: string, errCode: string, status: HttpStatus) {
    super(message, status);
    this.errCode = errCode;
  }

  getErrCode() {
    return this.errCode;
  }
}

enum DoWithErrorCode {
  // User
  UserAlreadyExists = '0011',
  UserNotFound = '0012',
  UserNameNotUnique = '0013',
  SelfFriendship = '0014',

  // Group
  FailedTojoinGroup = '0100',   // 그룹에 참가할 때
  FailedToleftGroup = '0101',   // 그룹 떠나기에 실패 했을 떄
  FailedToMakeGroup = '0102',   // 그룹 생성에 실패했을 때

  // Routine
  ExceedMaxRoutines = '0200',   // 그룹당 최대 3개의 루틴이 등록 가능하다

  // Utils
  NotAllowedExtension     = '1000',  // 지원하지 않는 확장자의 파일이 넘어왔을 때
  ThereIsNoFile           = '1001',  // 파일 업로드 모듈 이용시 요청에 파일을 보내지 않았을 때
  FailedToDeletedOriginal = '1002',  // 이미지 압축 후 원본 파일 삭제 실패시
  FailedToResizeImage     = '1003',  // 업로드한 이미지 압축에 실패시
  NoData                  = '1004',  // 요청한 데이터가 없는 경우
  FailedToInsertData      = '1005',
  FailedToUpdateData      = '1006',  // 수정 요청한 데이터가 DB에 존재하지 않는 경우
  FailedToDeleteData      = '1007',  // 삭제 ``
}

enum DoWithErrorMsg {
  // User
  UserAlreadyExists = 'User is already registerd',
  UserNotFound = 'User not found',
  UserNameNotUnique = 'User name is not unique',
  SelfFriendship = 'A user cannot befriend themselves',

  // Group
  FailedTojoinGroup = '그룹에 가입하는데 실패 했습니다.',
  FailedToleftGroup = '그룹을 나가는데 실패 했습니다.',
  FailedToMakeGroup = '그룹을 생성하는데 실패 했습니다.',

  // Routine
  ExceedMaxRoutines = '등록할 수 있는 최대 루틴을 초과하셨습니다.',

  // Utils
  NotAllowedExtension     = '지원하지 않는 파일 확장자입니다.',
  ThereIsNoFile           = '파일을 업로드 하지 않았습니다.',
  FailedToDeletedOriginal = '원본 파일을 삭제하는데 실패 했습니다.',
  FailedToResizeImage     = '이미지 압축에 실패 했습니다.',
  NoData                  = '요청하신 데이터가 없습니다.',
  FailedToInsertData      = '삽입에 실패 하였습니다.',
  FailedToUpdateData      = '수정에 실패 하였습니다.',
  FailedToDeleteData      = '삭제에 실패 하였습니다.',
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
  FailedTojoinGroup = new DoWithException(
    DoWithErrorMsg.FailedTojoinGroup,
    DoWithErrorCode.FailedTojoinGroup,
    HttpStatus.BAD_REQUEST,
  );

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

  // =============== [ Utils ] ===============
  NotAllowedExtension = new DoWithException(
    DoWithErrorMsg.NotAllowedExtension,
    DoWithErrorCode.NotAllowedExtension,
    HttpStatus.BAD_REQUEST,
  );

  ThereIsNoFile = new DoWithException(
    DoWithErrorMsg.ThereIsNoFile,
    DoWithErrorCode.ThereIsNoFile,
    HttpStatus.BAD_REQUEST,
  );

  FailedToDeletedOriginal = new DoWithException(
    DoWithErrorMsg.FailedToDeletedOriginal,
    DoWithErrorCode.FailedToDeletedOriginal,
    HttpStatus.BAD_REQUEST,
  );

  FailedToResizeImage = new DoWithException(
    DoWithErrorMsg.FailedToResizeImage,
    DoWithErrorCode.FailedToResizeImage,
    HttpStatus.BAD_REQUEST,
  );

  NoData = new DoWithException(
    DoWithErrorMsg.NoData,
    DoWithErrorCode.NoData,
    HttpStatus.BAD_REQUEST,
  );

  FailedToInsertData = new DoWithException(
    DoWithErrorMsg.FailedToInsertData,
    DoWithErrorCode.FailedToInsertData,
    HttpStatus.BAD_REQUEST,
  );

  FailedToDeleteData = new DoWithException(
    DoWithErrorMsg.FailedToDeleteData,
    DoWithErrorCode.FailedToDeleteData,
    HttpStatus.BAD_REQUEST,
  );

  FailedToUpdateData = new DoWithException(
    DoWithErrorMsg.FailedToUpdateData,
    DoWithErrorCode.FailedToUpdateData,
    HttpStatus.BAD_REQUEST,
  );
}