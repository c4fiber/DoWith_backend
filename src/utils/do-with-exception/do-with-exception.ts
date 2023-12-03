import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DoWithErrorCode } from 'src/enums/DoWithErrorCode.enum';
import { DoWithErrorMsg } from 'src/enums/DoWithErrorMsg.enum';

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
  FailToSignUp = new DoWithException(
    DoWithErrorMsg.FailToSignUp,
    DoWithErrorCode.FailToSignUp,
    HttpStatus.BAD_REQUEST,
  );

  // =============== [ Group ] ===============

  // =============== [ Routine ] ===============
  ExceedMaxRoutines = new DoWithException(
    DoWithErrorMsg.ExceedMaxRoutines,
    DoWithErrorCode.ExceedMaxRoutines,
    HttpStatus.BAD_REQUEST,
  );
  
  AtLeastOneRoutine = new DoWithException(
    DoWithErrorMsg.AtLeastOneRoutine,
    DoWithErrorCode.AtLeastOneRoutine,
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

  // =============== [ Friend ] ===============
  AlreadySendRequest = new DoWithException(
    DoWithErrorMsg.AlreadySendRequest,
    DoWithErrorCode.AlreadySendRequest,
    HttpStatus.BAD_REQUEST,
  );

  AlreadyInFriendship = new DoWithException(
    DoWithErrorMsg.AlreadyInFriendship,
    DoWithErrorCode.AlreadyInFriendship,
    HttpStatus.BAD_REQUEST,
  );

  BlockedByFriend = new DoWithException(
    DoWithErrorMsg.BlockedByFriend,
    DoWithErrorCode.BlockedByFriend,
    HttpStatus.BAD_REQUEST,
  );
  
  BlockedByMe = new DoWithException(
    DoWithErrorMsg.BlockedByMe,
    DoWithErrorCode.BlockedByMe,
    HttpStatus.BAD_REQUEST,
  );

  NotInFriendship = new DoWithException(
    DoWithErrorMsg.NotInFriendship,
    DoWithErrorCode.NotInFriendship,
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
  FailedToUpdateMyRoom = new DoWithException(
    DoWithErrorMsg.FailedToUpdateMyRoom,
    DoWithErrorCode.FailedToUpdateMyRoom,
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
}
