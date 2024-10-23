import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context: ExecutionContext) {
    if (err || !user) {
      return null;
    }
    return user;
  }
}
