export enum DoWithErrorMsg {
  // User
  UserAlreadyExists = 'User is already registerd',
  UserNotFound      = 'User not found',
  UserNameNotUnique = 'User name is not unique',
  SelfFriendship    = 'A user cannot befriend themselves',

  // Group

  // Routine
  ExceedMaxRoutines = '등록할 수 있는 최대 루틴을 초과 하셨습니다.',
  AtLeastOneRoutine = '최소 한 개의 루틴을 등록하셔야 합니다.',

  // Shop
  NotEnoughCash = '보유한 캐시가 부족합니다.',
  PetEvolFinished = '이미 최종 진화가 완료되었습니다.',

  // Todo
  AlreadyMadeTodos = '이미 할 일이 생성되었습니다.',

  // Friend
  AlreadySendRequest  = '이미 친구 요청을 보내셨습니다.',
  AlreadyInFriendship = '이미 친구 상태 입니다.',
  BlockedByFriend     = '차단 되었습니다.',
  BlockedByMe         = '차단한 친구 입니다.',
  NotInFriendship     = '친구 사이가 아닙니다.',

  // Utils
  NotAllowedExtension = '지원하지 않는 파일 확장자입니다.',
  ThereIsNoFile = '파일을 업로드 하지 않았습니다.',
  FailedToDeletedOriginal = '원본 파일을 삭제하는데 실패 했습니다.',
  FailedToResizeImage = '이미지 압축에 실패 했습니다.',
  NoData = '요청하신 데이터가 없습니다.',

  // Room
  ItemAlreadyInMyRoom = '아이템이 이미 방에 존재합니다.',
  ItemNotInInventory  = '보유하지 않은 아이템 입니다.',
  PetMustBeOne        = '펫은 방에 한마리만 둘 수 있습니다.'
}