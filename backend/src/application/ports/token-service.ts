import { UserRole } from '../../domain/entities/user';

export const TOKEN_SERVICE = 'TokenService';

export interface TokenPayload {
  userId: string;
  role: UserRole;
  distributorId: string | null;
}

export interface TokenService {
  sign(payload: TokenPayload): Promise<string>;
  verify(token: string): Promise<TokenPayload | null>;
}
