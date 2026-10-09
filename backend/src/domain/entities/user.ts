import { InvalidUserDistributorError } from './../errors/invalid-user-distributor.error';

export enum UserRole {
  Distributor = 'DISTRIBUTOR',
  Operator = 'OPERATOR',
}

export class User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: UserRole;
  readonly distributorId: string | null;

  constructor(
    id: string,
    name: string,
    email: string,
    passwordHash: string,
    role: UserRole,
    distributorId: string | null,
  ) {
    const isDistributorRole = role === UserRole.Distributor;
    const hasDistributor = distributorId !== null;

    if (isDistributorRole && !hasDistributor) {
      throw new InvalidUserDistributorError(
        'A user with the Distributor role must belong to a distributor',
      );
    }

    const isOperatorRole = role === UserRole.Operator;

    if (isOperatorRole && hasDistributor) {
      throw new InvalidUserDistributorError(
        'A user with the Operator role cannot belong to a distributor',
      );
    }

    this.id = id;
    this.name = name;
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role;
    this.distributorId = distributorId;
  }

  isOperator(): boolean {
    return this.role === UserRole.Operator;
  }

  isDistributor(): boolean {
    return this.role === UserRole.Distributor;
  }

  belongsToDistributor(distributorId: string): boolean {
    return this.distributorId === distributorId;
  }
}
