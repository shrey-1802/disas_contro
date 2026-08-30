import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType, PermissionType } from '../enums';
import { APP_CONSTANTS } from '../constants/app.constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(APP_CONSTANTS.ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      throw new ForbiddenException('Access denied: Role verification failed');
    }

    // Admin has bypass privilege
    if (user.role === RoleType.ADMIN) {
      return true;
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(`Access denied: Requires role [${requiredRoles.join(', ')}]`);
    }

    return true;
  }
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionType[]>(
      APP_CONSTANTS.PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Access denied: Permission verification failed');
    }

    // Admin has full access
    if (user.role === RoleType.ADMIN) {
      return true;
    }

    const userPermissions: string[] = user.permissions || [];
    const hasPermission = requiredPermissions.every((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasPermission) {
      throw new ForbiddenException(`Access denied: Missing required permissions`);
    }

    return true;
  }
}
