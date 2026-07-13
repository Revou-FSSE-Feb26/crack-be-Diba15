import { SetMetadata } from '@nestjs/common';
import type { Role } from '../../generated/prisma/enums.js';

export const ROLES_KEY = 'roles';

/**
 * Decorator untuk membatasi akses endpoint berdasarkan role.
 *
 * Contoh penggunaan:
 * @Roles('admin', 'curator')
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
