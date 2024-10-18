import { UnauthorizedException } from '@nestjs/common';

export class SessionExpiredException extends UnauthorizedException {
  constructor(
    message = 'Срок действия сессии истек. Пожалуйста, выполните вход снова.',
  ) {
    super({ message, code: 'SESSION_EXPIRED' });
  }
}
