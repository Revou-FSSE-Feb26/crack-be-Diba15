import type { Role, User } from '../../generated/prisma/client';

export interface AuthRepositoryInterface {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByIdWithProfile(id: string): Promise<any | null>;
  register(data: { name: string; email: string; password: string; role?: Role }): Promise<User>;
  updatePassword(id: string, hashedPassword: string): Promise<User>;
}
