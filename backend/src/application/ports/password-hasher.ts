export const PASSWORD_HASHER = 'PasswordHasher';

export interface PasswordHasher {
  matches(password: string, passwordHash: string): Promise<boolean>;
}
