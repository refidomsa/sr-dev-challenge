import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApproveOrderUseCase } from '../../application/use-cases/approve-order.use-case';
import { CancelOrderUseCase } from '../../application/use-cases/cancel-order.use-case';
import { CreateOrderUseCase } from '../../application/use-cases/create-order.use-case';
import { DispatchOrderUseCase } from '../../application/use-cases/dispatch-order.use-case';
import { GetOrderUseCase } from '../../application/use-cases/get-order.use-case';
import { ListOrdersUseCase } from '../../application/use-cases/list-orders.use-case';
import { RejectOrderUseCase } from '../../application/use-cases/reject-order.use-case';
import { User } from '../../domain/entities/user';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateOrderDto } from '../dto/create-order.dto';
import { ListOrdersQuery } from '../dto/list-orders.query';
import { RejectOrderDto } from '../dto/reject-order.dto';
import { OrderResponse, toOrderResponse } from '../presenters/order.presenter';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

export interface OrderListResponse {
  items: OrderResponse[];
  total: number;
  page: number;
  pageSize: number;
}

// The controllers only translate: HTTP in, use case, JSON out.
// They do not decide permissions or business rules.
@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(
    private readonly listOrders: ListOrdersUseCase,
    private readonly getOrder: GetOrderUseCase,
    private readonly createOrder: CreateOrderUseCase,
    private readonly approveOrder: ApproveOrderUseCase,
    private readonly rejectOrder: RejectOrderUseCase,
    private readonly dispatchOrder: DispatchOrderUseCase,
    private readonly cancelOrder: CancelOrderUseCase,
  ) { }

  // GET /orders?status=&distributorId=&deliveryFrom=&deliveryTo=&page=&pageSize=
  @Get()
  async list(
    @CurrentUser() user: User,
    @Query() query: ListOrdersQuery,
  ): Promise<OrderListResponse> {
    const page = query.page ?? DEFAULT_PAGE;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

    // The days of the filter are Dominican days (4 hours behind UTC):
    // from the first moment of the first day to the last moment of the last day.
    let deliveryFrom: Date | null = null;
    if (query.deliveryFrom !== undefined) {
      deliveryFrom = new Date(`${query.deliveryFrom}T00:00:00.000-04:00`);
    }

    let deliveryTo: Date | null = null;
    if (query.deliveryTo !== undefined) {
      deliveryTo = new Date(`${query.deliveryTo}T23:59:59.999-04:00`);
    }

    const result = await this.listOrders.execute({
      user: user,
      distributorId: query.distributorId ?? null,
      status: query.status ?? null,
      deliveryFrom: deliveryFrom,
      deliveryTo: deliveryTo,
      page: page,
      pageSize: pageSize,
    });

    const items: OrderResponse[] = [];
    for (const order of result.orders) {
      items.push(toOrderResponse(order));
    }

    return {
      items: items,
      total: result.total,
      page: page,
      pageSize: pageSize,
    };
  }

  // GET /orders/:id
  @Get(':id')
  async detail(
    @CurrentUser() user: User,
    @Param('id') orderId: string,
  ): Promise<OrderResponse> {
    const order = await this.getOrder.execute({ user: user, orderId: orderId });
    return toOrderResponse(order);
  }

  // POST /orders
  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() body: CreateOrderDto,
  ): Promise<OrderResponse> {
    const order = await this.createOrder.execute({
      user: user,
      lines: body.lines,
      deliveryDate: new Date(body.deliveryDate!),
    });
    return toOrderResponse(order);
  }

  // POST /orders/:id/approve
  @Post(':id/approve')
  @HttpCode(200)
  async approve(
    @CurrentUser() user: User,
    @Param('id') orderId: string,
  ): Promise<OrderResponse> {
    const order = await this.approveOrder.execute({
      user: user,
      orderId: orderId,
    });
    return toOrderResponse(order);
  }

  // POST /orders/:id/reject
  @Post(':id/reject')
  @HttpCode(200)
  async reject(
    @CurrentUser() user: User,
    @Param('id') orderId: string,
    @Body() body: RejectOrderDto,
  ): Promise<OrderResponse> {
    const order = await this.rejectOrder.execute({
      user: user,
      orderId: orderId,
      reason: body.reason!,
    });
    return toOrderResponse(order);
  }

  // POST /orders/:id/dispatch
  @Post(':id/dispatch')
  @HttpCode(200)
  async dispatch(
    @CurrentUser() user: User,
    @Param('id') orderId: string,
  ): Promise<OrderResponse> {
    const order = await this.dispatchOrder.execute({
      user: user,
      orderId: orderId,
    });
    return toOrderResponse(order);
  }

  // POST /orders/:id/cancel
  @Post(':id/cancel')
  @HttpCode(200)
  async cancel(
    @CurrentUser() user: User,
    @Param('id') orderId: string,
  ): Promise<OrderResponse> {
    const order = await this.cancelOrder.execute({
      user: user,
      orderId: orderId,
    });
    return toOrderResponse(order);
  }
}
