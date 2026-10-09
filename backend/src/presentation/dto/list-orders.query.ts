import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Matches } from 'class-validator';
import { OrderStatus } from '../../domain/entities/order-status';

const DAY_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

// What can come in the URL: /orders?status=PENDING&page=2
export class ListOrdersQuery {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  distributorId?: string;

  // Days like "2026-10-12", in Dominican time
  @IsOptional()
  @Matches(DAY_FORMAT, { message: 'deliveryFrom must be a day: YYYY-MM-DD' })
  deliveryFrom?: string;

  @IsOptional()
  @Matches(DAY_FORMAT, { message: 'deliveryTo must be a day: YYYY-MM-DD' })
  deliveryTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number;
}
