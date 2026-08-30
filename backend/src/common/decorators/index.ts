import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RoleType, PermissionType } from '../enums';
import { APP_CONSTANTS } from '../constants/app.constants';

export const Roles = (...roles: RoleType[]) => SetMetadata(APP_CONSTANTS.ROLES_KEY, roles);

export const Permissions = (...permissions: PermissionType[]) =>
  SetMetadata(APP_CONSTANTS.PERMISSIONS_KEY, permissions);

export const Public = () => SetMetadata(APP_CONSTANTS.IS_PUBLIC_KEY, true);

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
