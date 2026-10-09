import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { ProductId } from '../../domain/entities/product';

// The DTOs only check the shape of what arrives (types, required fields).
// The business rules (500 gallons, 24 hours, credit...) are checked by the domain.
export class CreateOrderLineDto {
  @IsEnum(ProductId)
  productId: ProductId;

  @IsInt()
  gallons: number;
}

export class CreateOrderDto {
  // A date with time, for example "2026-10-12T14:00:00.000Z"
  @IsDateString()
  deliveryDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderLineDto)
  lines: CreateOrderLineDto[];
}
