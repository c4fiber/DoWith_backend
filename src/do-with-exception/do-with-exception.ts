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

  // Routine
  ExceedMaxRoutines = '0200', // 그룹당 최대 3개의 루틴이 등록 가능하다

  // Shop
  NotEnoughCash = '300', // 물건 구입 시 보유한 금액이 충분하지 않은 경우
  PetEvolFinished = '301', // 이미 진화가 완료된 경우

  // Todo
  AlreadyMadeTodos = '400',

  // Utils
  NotAllowedExtension = '1000', // 지원하지 않는 확장자의 파일이 넘어왔을 때
  ThereIsNoFile = '1001', // 파일 업로드 모듈 이용시 요청에 파일을 보내지 않았을 때
  FailedToDeletedOriginal = '1002', // 이미지 압축 후 원본 파일 삭제 실패시
  FailedToResizeImage = '1003', // 업로드한 이미지 압축에 실패시
  NoData = '1004', // 요청한 데이터가 없는 경우

  // Room
  ItemAlreadyInMyRoom = '409', // 이미 펫이 존재하는 경우
  ItemNotInInventory = '404', // 펫이 존재하지 않는 경우
  PetMustBeOne = '410', // 펫은 하나만 존재해야 한다.
}

enum DoWithErrorMsg {
  // User
  UserAlreadyExists = 'User is already registerd',
  UserNotFound = 'User not found',
  UserNameNotUnique = 'User name is not unique',
  SelfFriendship = 'A user cannot befriend themselves',

  // Group

  // Routine
  ExceedMaxRoutines = '등록할 수 있는 최대 루틴을 초과하셨습니다.',

  // Shop
  NotEnoughCash = '보유한 캐시가 부족합니다.',
  PetEvolFinished = '이미 최종 진화가 완료되었습니다.',

  // Todo
  AlreadyMadeTodos = '이미 할 일이 생성되었습니다.',

  // Utils
  NotAllowedExtension = '지원하지 않는 파일 확장자입니다.',
  ThereIsNoFile = '파일을 업로드 하지 않았습니다.',
  FailedToDeletedOriginal = '원본 파일을 삭제하는데 실패 했습니다.',
  FailedToResizeImage = '이미지 압축에 실패 했습니다.',
  NoData = '요청하신 데이터가 없습니다.',

  // Room
  ItemAlreadyInMyRoom = '아이템이 이미 방에 존재합니다.',
  ItemNotInInventory = '보유하지 않은 아이템 입니다.',
  PetMustBeOne = '펫은 방에 한마리만 둘 수 있습니다.',
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

  // =============== [ Routine ] ===============
  ExceedMaxRoutines = new DoWithException(
    DoWithErrorMsg.ExceedMaxRoutines,
    DoWithErrorCode.ExceedMaxRoutines,
    HttpStatus.BAD_REQUEST,
  );

  // =============== [ Shop ] ===============
  AlreadyMadeTodos = new DoWithException(
    DoWithErrorMsg.AlreadyMadeTodos,
    DoWithErrorCode.AlreadyMadeTodos,
    HttpStatus.BAD_REQUEST,
  );

  PetEvolFinished = new DoWithException(
    DoWithErrorMsg.PetEvolFinished,
    DoWithErrorCode.PetEvolFinished,
    HttpStatus.BAD_REQUEST,
  );

  // =============== [ Todo ] ===============
  NotEnoughCash = new DoWithException(
    DoWithErrorMsg.NotEnoughCash,
    DoWithErrorCode.NotEnoughCash,
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

  // =============== [ Room ] ===============
  ItemAlreadyInMyRoom = new DoWithException(
    DoWithErrorMsg.ItemAlreadyInMyRoom,
    DoWithErrorCode.ItemAlreadyInMyRoom,
    HttpStatus.CONFLICT,
  );
  ItemNotInInventory = new DoWithException(
    DoWithErrorMsg.ItemNotInInventory,
    DoWithErrorCode.ItemNotInInventory,
    HttpStatus.NOT_FOUND,
  );
  PetMustBeOne = new DoWithException(
    DoWithErrorMsg.PetMustBeOne,
    DoWithErrorCode.PetMustBeOne,
    HttpStatus.CONFLICT,
  );
}
