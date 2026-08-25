export interface SessionRepositoryInterface {
  createSession(data: { userId: string; refreshToken: string; userAgent?: string }): Promise<any>;
  findSessionsByUserId(userId: string): Promise<any[]>;
  updateSessionToken(sessionId: string, newHashedToken: string): Promise<any>;
  deleteSession(sessionId: string): Promise<any>;
  deleteAllUserSessions(userId: string): Promise<any>;
}
