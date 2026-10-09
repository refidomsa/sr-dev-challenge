import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  AvailableCredit,
  GetAvailableCreditUseCase,
} from '../../application/use-cases/get-available-credit.use-case';
import { ListDistributorsUseCase } from '../../application/use-cases/list-distributors.use-case';
import { User } from '../../domain/entities/user';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

export interface DistributorResponse {
  id: string;
  name: string;
  rnc: string;
}

@Controller('distributors')
@UseGuards(AuthGuard)
export class DistributorsController {
  constructor(
    private readonly listDistributors: ListDistributorsUseCase,
    private readonly getAvailableCredit: GetAvailableCreditUseCase,
  ) {}

  // GET /distributors (only operators)
  @Get()
  async list(@CurrentUser() user: User): Promise<DistributorResponse[]> {
    const distributors = await this.listDistributors.execute({ user: user });

    const response: DistributorResponse[] = [];
    for (const distributor of distributors) {
      response.push({
        id: distributor.id,
        name: distributor.name,
        rnc: distributor.rnc,
      });
    }
    return response;
  }

  // GET /distributors/:id/credit
  @Get(':id/credit')
  async credit(
    @CurrentUser() user: User,
    @Param('id') distributorId: string,
  ): Promise<AvailableCredit> {
    return this.getAvailableCredit.execute({
      user: user,
      distributorId: distributorId,
    });
  }
}
