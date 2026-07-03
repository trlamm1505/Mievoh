import { SetMetadata } from '@nestjs/common';

export const IS_ROLES = 'roles';

export const Roles = (...roles: string[]) => SetMetadata(IS_ROLES, roles);
