import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductId, ProductName } from '../../domain/entities/product';
import { UserRole } from '../../domain/entities/user';
import { BcryptPasswordHasher } from '../security/bcrypt-password-hasher';
import { DistributorOrmEntity } from './entities/distributor.orm-entity';
import { ProductOrmEntity } from './entities/product.orm-entity';
import { UserOrmEntity } from './entities/user.orm-entity';

// The test users come from the .env file. Without it, these documented values are used.
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "";
const SEED_OPERATOR_EMAIL =
  process.env.SEED_OPERATOR_EMAIL ?? ""
const SEED_DISTRIBUTOR_1_EMAIL =
  process.env.SEED_DISTRIBUTOR_1_EMAIL ?? ""
const SEED_DISTRIBUTOR_2_EMAIL =
  process.env.SEED_DISTRIBUTOR_2_EMAIL ?? "";

// Fills the empty database with the data the challenge asks for:
// 4 products, 3 distributors, 2 distributor users and 1 operator.
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly products: Repository<ProductOrmEntity>,
    @InjectRepository(DistributorOrmEntity)
    private readonly distributors: Repository<DistributorOrmEntity>,
    @InjectRepository(UserOrmEntity)
    private readonly users: Repository<UserOrmEntity>,
    private readonly passwordHasher: BcryptPasswordHasher,
  ) { }

  // NestJS calls this once, when the application starts.
  async onApplicationBootstrap(): Promise<void> {
    const alreadySeeded = (await this.products.count()) > 0;
    if (alreadySeeded) {
      return;
    }

    // Prices in cents: 29010 = RD$290.10
    await this.products.save([
      {
        id: ProductId.PremiumGasoline,
        name: ProductName.PremiumGasoline,
        pricePerGallonCents: 29010,
      },
      {
        id: ProductId.RegularGasoline,
        name: ProductName.RegularGasoline,
        pricePerGallonCents: 27250,
      },
      {
        id: ProductId.OptimumDiesel,
        name: ProductName.OptimumDiesel,
        pricePerGallonCents: 24210,
      },
      {
        id: ProductId.RegularDiesel,
        name: ProductName.RegularDiesel,
        pricePerGallonCents: 22140,
      },
    ]);

    // Credit limits in cents: 500000000 = RD$5,000,000.00
    await this.distributors.save([
      {
        id: 'distributor-1',
        name: 'Estación Los Prados',
        rnc: '101000001',
        creditLimitCents: 500000000,
      },
      {
        id: 'distributor-2',
        name: 'Estación El Caribe',
        rnc: '101000002',
        creditLimitCents: 300000000,
      },
      {
        id: 'distributor-3',
        name: 'Estación La Vega',
        rnc: '101000003',
        creditLimitCents: 20000000,
      },
    ]);

    const passwordHash = await this.passwordHasher.hash(SEED_PASSWORD);
    await this.users.save([
      {
        id: 'user-1',
        name: 'Luis Gómez',
        email: SEED_OPERATOR_EMAIL,
        passwordHash: passwordHash,
        role: UserRole.Operator,
        distributorId: null,
      },
      {
        id: 'user-2',
        name: 'Ana Pérez',
        email: SEED_DISTRIBUTOR_1_EMAIL,
        passwordHash: passwordHash,
        role: UserRole.Distributor,
        distributorId: 'distributor-1',
      },
      {
        id: 'user-3',
        name: 'Carlos Díaz',
        email: SEED_DISTRIBUTOR_2_EMAIL,
        passwordHash: passwordHash,
        role: UserRole.Distributor,
        distributorId: 'distributor-2',
      },
    ]);

    this.logger.log('Seed data created');
  }
}
