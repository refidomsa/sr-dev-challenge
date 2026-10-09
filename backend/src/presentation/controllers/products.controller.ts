import { Controller, Get, UseGuards } from '@nestjs/common';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { AuthGuard } from '../auth/auth.guard';

export interface ProductResponse {
  id: string;
  name: string;
  pricePerGallonCents: number;
}

@Controller('products')
@UseGuards(AuthGuard)
export class ProductsController {
  constructor(private readonly listProducts: ListProductsUseCase) {}

  // GET /products
  @Get()
  async list(): Promise<ProductResponse[]> {
    const products = await this.listProducts.execute();

    const response: ProductResponse[] = [];
    for (const product of products) {
      response.push({
        id: product.id,
        name: product.name,
        pricePerGallonCents: product.pricePerGallonCents,
      });
    }
    return response;
  }
}
