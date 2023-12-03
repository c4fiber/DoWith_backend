export enum DoWithErrorCode {
  // User
  UserAlreadyExists = '0011',
  UserNotFound      = '0012',
  UserNameNotUnique = '0013',
  SelfFriendship    = '0014',

  // Group

  // Routine
  ExceedMaxRoutines = '0200',   // 그룹당 최대 3개의 루틴이 등록 가능하다
  AtLeastOneRoutine = '0201',

  // Shop
  NotEnoughCash     = '0300',    // 물건 구입 시 보유한 금액이 충분하지 않은 경우
  PetEvolFinished   = '0301',    // 이미 진화가 완료된 경우

  // Todo
  AlreadyMadeTodos  = '0400',

  // Friend
  AlreadySendRequest  = '0500',
  AlreadyInFriendship = '0501',
  BlockedByFriend     = '0502',
  BlockedByMe         = '0503',
  NotInFriendship     = '0504',

  // Utils
  NotAllowedExtension     = '1000', // 지원하지 않는 확장자의 파일이 넘어왔을 때
  ThereIsNoFile           = '1001', // 파일 업로드 모듈 이용시 요청에 파일을 보내지 않았을 때
  FailedToDeletedOriginal = '1002', // 이미지 압축 후 원본 파일 삭제 실패시
  FailedToResizeImage     = '1003', // 업로드한 이미지 압축에 실패시
  NoData                  = '1004', // 요청한 데이터가 없는 경우

  // Room
  ItemAlreadyInMyRoom  = '409',  // 이미 펫이 존재하는 경우
  ItemNotInInventory   = '404',  // 펫이 존재하지 않는 경우
  PetMustBeOne         = '410',  // 펫은 하나만 존재해야 한다.
  FailedToUpdateMyRoom = '411', // 방을 업데이트 하는데 실패했을 때
}