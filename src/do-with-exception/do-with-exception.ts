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
  TestError = '0010',
  UserAlreadyExists = '0011',
}

enum DoWithErrorMsg {
  TestError = 'This is not permmited',
  UserAlreadyExists = 'User is already registerd',
}

@Injectable()
export class DoWithExceptions {
  NotPermitted = new DoWithException(
    DoWithErrorMsg.TestError,
    DoWithErrorCode.TestError,
    HttpStatus.BAD_REQUEST,
  );
  UserAlreadyExists = new DoWithException(
    DoWithErrorMsg.UserAlreadyExists,
    DoWithErrorCode.UserAlreadyExists,
    HttpStatus.BAD_REQUEST,
  );
}
