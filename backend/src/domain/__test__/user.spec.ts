import { User, UserRole } from '../entities/user';
import { InvalidUserDistributorError } from '../errors/invalid-user-distributor.error';

describe('User', () => {
  it('keeps its data', () => {
    const user = new User(
      'user-1',
      'Ana Pérez',
      'ana@losprados.com',
      'hashed-password',
      UserRole.Distributor,
      'distributor-1',
    );

    expect(user.id).toBe('user-1');
    expect(user.name).toBe('Ana Pérez');
    expect(user.email).toBe('ana@losprados.com');
    expect(user.passwordHash).toBe('hashed-password');
    expect(user.role).toBe(UserRole.Distributor);
    expect(user.distributorId).toBe('distributor-1');
  });

  describe('a user with the Distributor role', () => {
    const distributorUser = new User(
      'user-1',
      'Ana Pérez',
      'ana@losprados.com',
      'hashed-password',
      UserRole.Distributor,
      'distributor-1',
    );

    it('is a distributor', () => {
      expect(distributorUser.isDistributor()).toBe(true);
    });

    it('is not an operator', () => {
      expect(distributorUser.isOperator()).toBe(false);
    });

    it('belongs to its own distributor', () => {
      expect(distributorUser.belongsToDistributor('distributor-1')).toBe(true);
    });

    it('does not belong to another distributor', () => {
      expect(distributorUser.belongsToDistributor('distributor-2')).toBe(false);
    });

    it('must belong to a distributor', () => {
      const createUser = () =>
        new User(
          'user-1',
          'Ana Pérez',
          'ana@losprados.com',
          'hashed-password',
          UserRole.Distributor,
          null,
        );

      expect(createUser).toThrow(InvalidUserDistributorError);
    });
  });

  describe('a user with the Operator role', () => {
    const operatorUser = new User(
      'user-2',
      'Luis Gómez',
      'luis@refidomsa.com',
      'hashed-password',
      UserRole.Operator,
      null,
    );

    it('is an operator', () => {
      expect(operatorUser.isOperator()).toBe(true);
    });

    it('is not a distributor', () => {
      expect(operatorUser.isDistributor()).toBe(false);
    });

    it('does not belong to any distributor', () => {
      expect(operatorUser.belongsToDistributor('distributor-1')).toBe(false);
    });

    it('cannot belong to a distributor', () => {
      const createUser = () =>
        new User(
          'user-2',
          'Luis Gómez',
          'luis@refidomsa.com',
          'hashed-password',
          UserRole.Operator,
          'distributor-1',
        );

      expect(createUser).toThrow(InvalidUserDistributorError);
    });
  });
});
