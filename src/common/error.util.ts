import {
  ConflictException,
  HttpException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

export const handleError = (message: string, statusCode = 500): never => {
  if (statusCode === 401) {
    throw new UnauthorizedException(message);
  }

  if (statusCode === 409) {
    throw new ConflictException(message);
  }

  throw new InternalServerErrorException(message);
};

export const throwHttpError = (error: unknown, message?: string): never => {
  if (error instanceof HttpException) {
    throw error;
  }

  throw new InternalServerErrorException(message ?? 'Something went wrong');
};
