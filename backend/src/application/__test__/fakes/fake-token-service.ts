import { TokenPayload, TokenService } from '../../ports/token-service';

// A token service for tests: it remembers the last payload it signed.
export class FakeTokenService implements TokenService {
  lastPayload: TokenPayload | null = null;

  sign(payload: TokenPayload): Promise<string> {
    this.lastPayload = payload;
    return Promise.resolve(`token-of-${payload.userId}`);
  }

  verify(): Promise<TokenPayload | null> {
    return Promise.resolve(this.lastPayload);
  }
}
