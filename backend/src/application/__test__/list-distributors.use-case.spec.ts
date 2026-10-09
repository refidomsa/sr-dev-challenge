import { Distributor } from '../../domain/entities/distributor';
import { ForbiddenActionError } from '../errors/forbidden-action.error';
import { ListDistributorsUseCase } from '../use-cases/list-distributors.use-case';
import { InMemoryDistributorRepository } from './fakes/in-memory-distributor.repository';
import { distributorUser, operatorUser } from './fakes/sample-data';

describe('ListDistributorsUseCase', () => {
  let listDistributors: ListDistributorsUseCase;

  beforeEach(() => {
    const distributorRepository = new InMemoryDistributorRepository();
    listDistributors = new ListDistributorsUseCase(distributorRepository);

    distributorRepository.distributors.push(
      new Distributor('distributor-1', 'Los Prados', '101000001', 50000000),
    );
  });

  it('shows all the distributors to an operator', async () => {
    const distributors = await listDistributors.execute({
      user: operatorUser,
    });

    expect(distributors.length).toBe(1);
  });

  it('does not let a distributor list the distributors', async () => {
    const action = listDistributors.execute({ user: distributorUser });

    await expect(action).rejects.toThrow(ForbiddenActionError);
  });
});
