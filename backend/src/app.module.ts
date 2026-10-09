import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CLOCK } from './application/ports/clock';
import { ID_GENERATOR } from './application/ports/id-generator';
import { PASSWORD_HASHER } from './application/ports/password-hasher';
import { TOKEN_SERVICE } from './application/ports/token-service';
import { ApproveOrderUseCase } from './application/use-cases/approve-order.use-case';
import { CancelOrderUseCase } from './application/use-cases/cancel-order.use-case';
import { CreateOrderUseCase } from './application/use-cases/create-order.use-case';
import { DispatchOrderUseCase } from './application/use-cases/dispatch-order.use-case';
import { GetAvailableCreditUseCase } from './application/use-cases/get-available-credit.use-case';
import { GetOrderUseCase } from './application/use-cases/get-order.use-case';
import { ListDistributorsUseCase } from './application/use-cases/list-distributors.use-case';
import { ListOrdersUseCase } from './application/use-cases/list-orders.use-case';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RejectOrderUseCase } from './application/use-cases/reject-order.use-case';
import { DISTRIBUTOR_REPOSITORY } from './domain/repositories/distributor.repository';
import { ORDER_REPOSITORY } from './domain/repositories/order.repository';
import { PRODUCT_REPOSITORY } from './domain/repositories/product.repository';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { DistributorOrmEntity } from './infrastructure/database/entities/distributor.orm-entity';
import { OrderLineOrmEntity } from './infrastructure/database/entities/order-line.orm-entity';
import { OrderOrmEntity } from './infrastructure/database/entities/order.orm-entity';
import { ProductOrmEntity } from './infrastructure/database/entities/product.orm-entity';
import { UserOrmEntity } from './infrastructure/database/entities/user.orm-entity';
import { TypeOrmDistributorRepository } from './infrastructure/database/repositories/typeorm-distributor.repository';
import { TypeOrmOrderRepository } from './infrastructure/database/repositories/typeorm-order.repository';
import { TypeOrmProductRepository } from './infrastructure/database/repositories/typeorm-product.repository';
import { TypeOrmUserRepository } from './infrastructure/database/repositories/typeorm-user.repository';
import { SeedService } from './infrastructure/database/seed.service';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { JwtTokenService } from './infrastructure/security/jwt-token.service';
import { SystemClock } from './infrastructure/system/system-clock';
import { UuidIdGenerator } from './infrastructure/system/uuid-id-generator';
import { AuthGuard } from './presentation/auth/auth.guard';
import { AuthController } from './presentation/controllers/auth.controller';
import { DistributorsController } from './presentation/controllers/distributors.controller';
import { OrdersController } from './presentation/controllers/orders.controller';
import { ProductsController } from './presentation/controllers/products.controller';

const ORM_ENTITIES = [
  ProductOrmEntity,
  DistributorOrmEntity,
  UserOrmEntity,
  OrderOrmEntity,
  OrderLineOrmEntity,
];

// This is the only place that knows every layer.
// Here each interface is connected with the class that implements it.
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST ?? 'localhost',
      port: Number(process.env.DATABASE_PORT ?? 5433),
      username: process.env.DATABASE_USER ?? 'postgres',
      password: process.env.DATABASE_PASSWORD ?? 'postgres',
      database: process.env.DATABASE_NAME ?? 'fuel_orders',
      entities: ORM_ENTITIES,
      // Creates the tables from the entities when the application starts.
      // Good enough for the challenge; in production this would be migrations.
      synchronize: true,
    }),
    TypeOrmModule.forFeature(ORM_ENTITIES),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'local-development-secret',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [
    AuthController,
    OrdersController,
    ProductsController,
    DistributorsController,
  ],
  providers: [
    // Interface -> implementation
    { provide: PRODUCT_REPOSITORY, useClass: TypeOrmProductRepository },
    { provide: DISTRIBUTOR_REPOSITORY, useClass: TypeOrmDistributorRepository },
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
    { provide: ORDER_REPOSITORY, useClass: TypeOrmOrderRepository },
    { provide: CLOCK, useClass: SystemClock },
    { provide: ID_GENERATOR, useClass: UuidIdGenerator },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },

    // Use cases
    LoginUseCase,
    ListProductsUseCase,
    ListDistributorsUseCase,
    GetAvailableCreditUseCase,
    ListOrdersUseCase,
    GetOrderUseCase,
    CreateOrderUseCase,
    ApproveOrderUseCase,
    RejectOrderUseCase,
    DispatchOrderUseCase,
    CancelOrderUseCase,

    // Others
    AuthGuard,
    BcryptPasswordHasher,
    SeedService,
  ],
})
export class AppModule {}
