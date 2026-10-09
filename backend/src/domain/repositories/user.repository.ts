// domain/repositories/user.repository.ts
import { User } from '../entities/user';

export const USER_REPOSITORY = 'UserRepository';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}
