import { UnauthorizedException } from '@nestjs/common';

export class InvalidSessionException extends UnauthorizedException {
  constructor(
    message = 'Недействительная сессия. Пожалуйста, выполните вход снова.',
  ) {
    super({ message, code: 'INVALID_SESSION' });
  }
}
