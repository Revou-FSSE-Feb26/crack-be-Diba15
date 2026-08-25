import type { Prisma, User } from '../../generated/prisma/client';

export interface UsersRepositoryInterface {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAllWithProfile(): Promise<any[]>;
  findOneWithProfile(id: string): Promise<any | null>;
  update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
  getBalance(id: string): Promise<{ id: string; balance: number } | null>;
  topUp(id: string, amount: number): Promise<any>;
  withdraw(id: string, amount: number): Promise<any>;
  delete(id: string): Promise<User>;
}
