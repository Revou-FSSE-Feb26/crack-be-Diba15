export interface PasswordResetRepositoryInterface {
  createToken(userId: string, token: string, expiresAt: Date): Promise<any>;
  findToken(token: string): Promise<any | null>;
  deleteToken(id: string): Promise<any>;
  deleteUserTokens(userId: string): Promise<any>;
}
