import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRequest } from 'src/polls/types';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request: AuthRequest = context.switchToHttp().getRequest();
    this.logger.debug(`Checking for auth token on request body`, request.body);
    const { accessToken } = request.body;

    try {
      const payload = this.jwtService.verify(accessToken);
      // append user and poll to socket
      request.userId = payload.sub;
      request.pollId = payload.pollId;
      request.name = payload.name;
      return true;
    } catch {
      throw new ForbiddenException('Invalid authorization token');
    }
  }
}
