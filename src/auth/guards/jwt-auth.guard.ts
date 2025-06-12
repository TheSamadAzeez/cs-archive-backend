import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorators';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      return false;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles) {
      const request = context.switchToHttp().getRequest();
      console.log('User in request:', request.user);
      const user = request.user;

      // Add additional safety checks
      if (!user) {
        throw new ForbiddenException('User not found in request');
      }

      if (!user.roles || !Array.isArray(user.roles)) {
        throw new ForbiddenException('User roles not properly configured');
      }

      if (!requiredRoles.some((role) => user.roles.includes(role))) {
        throw new ForbiddenException(
          'You do not have the required roles to access this resource',
        );
      }
    }

    return true;
  }
}
