import { PasswordHasher } from '../../ports/password-hasher';

export class FakePasswordHasher implements PasswordHasher {
  matches(password: string, passwordHash: string): Promise<boolean> {
    const expectedHash = `hashed-${password}`;
    return Promise.resolve(expectedHash === passwordHash);
  }
}
