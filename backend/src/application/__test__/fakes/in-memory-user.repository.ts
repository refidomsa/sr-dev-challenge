import { User } from '../../../domain/entities/user';
import { UserRepository } from '../../../domain/repositories/user.repository';

export class InMemoryUserRepository implements UserRepository {
  users: User[] = [];

  findById(id: string): Promise<User | null> {
    for (const user of this.users) {
      if (user.id === id) {
        return Promise.resolve(user);
      }
    }
    return Promise.resolve(null);
  }

  findByEmail(email: string): Promise<User | null> {
    for (const user of this.users) {
      if (user.email === email) {
        return Promise.resolve(user);
      }
    }
    return Promise.resolve(null);
  }
}
