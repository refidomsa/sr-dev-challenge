import { User, UserRole } from '../../domain/entities/user';
import { InvalidCredentialsError } from '../errors/invalid-credentials.error';
import { LoginUseCase } from '../use-cases/login.use-case';
import { FakePasswordHasher } from './fakes/fake-password-hasher';
import { FakeTokenService } from './fakes/fake-token-service';
import { InMemoryUserRepository } from './fakes/in-memory-user.repository';

describe('LoginUseCase', () => {
  let tokenService: FakeTokenService;
  let login: LoginUseCase;

  // Each test starts with one distributor user whose password is 'secret123'.
  beforeEach(() => {
    const userRepository = new InMemoryUserRepository();
    tokenService = new FakeTokenService();
    login = new LoginUseCase(
      userRepository,
      new FakePasswordHasher(),
      tokenService,
    );

    userRepository.users.push(
      new User(
        'user-2',
        'Ana Pérez',
        'ana@losprados.com',
        'hashed-secret123',
        UserRole.Distributor,
        'distributor-1',
      ),
    );
  });

  it('returns a token when the email and the password are correct', async () => {
    const result = await login.execute({
      email: 'ana@losprados.com',
      password: 'secret123',
    });

    expect(result.accessToken).toBe('token-of-user-2');
  });

  it('returns the data of the user', async () => {
    const result = await login.execute({
      email: 'ana@losprados.com',
      password: 'secret123',
    });

    expect(result.name).toBe('Ana Pérez');
    expect(result.role).toBe(UserRole.Distributor);
    expect(result.distributorId).toBe('distributor-1');
  });

  it('saves the user, the role and the distributor inside the token', async () => {
    await login.execute({
      email: 'ana@losprados.com',
      password: 'secret123',
    });

    expect(tokenService.lastPayload).toEqual({
      userId: 'user-2',
      role: UserRole.Distributor,
      distributorId: 'distributor-1',
    });
  });

  it('rejects a wrong password', async () => {
    const action = login.execute({
      email: 'ana@losprados.com',
      password: 'wrong-password',
    });

    await expect(action).rejects.toThrow(InvalidCredentialsError);
  });

  it('rejects an email that is not registered', async () => {
    const action = login.execute({
      email: 'nobody@example.com',
      password: 'secret123',
    });

    await expect(action).rejects.toThrow(InvalidCredentialsError);
  });
});
