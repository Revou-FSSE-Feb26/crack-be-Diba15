import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

/**
 * Decorator untuk mengambil user yang sedang login dari request.
 *
 * Contoh penggunaan:
 * @GetCurrentUser() user: JwtPayload
 * @GetCurrentUser('id') userId: string
 */
export const GetCurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (data) return request.user?.[data];
    return request.user;
  },
);
