import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../../domain/entities/user';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { UserOrmEntity } from '../entities/user.orm-entity';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.repository.findOneBy({ id: id });
    if (row === null) {
      return null;
    }
    return this.toDomain(row);
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.repository.findOneBy({ email: email });
    if (row === null) {
      return null;
    }
    return this.toDomain(row);
  }

  private toDomain(row: UserOrmEntity): User {
    return new User(
      row.id,
      row.name,
      row.email,
      row.passwordHash,
      row.role as UserRole,
      row.distributorId,
    );
  }
}
