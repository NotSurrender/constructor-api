import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { UserId } from "src/decorators/user-id.decorator";
import { BalanceOperationService } from "./balance-operation.service";
import {
  BalanceOperationResponseDocument,
  BalanceOperationType,
} from "./balance-operation.interface";
import { IdValidationPipe } from "src/pipes/id-validation.pipe";
import { DateValidationPipe } from "src/pipes/date-validation.pipe";
import { OperationTypeValidationPipe } from "src/pipes/operation-type-validation.pipe";
import { IntValidationPipe } from "src/pipes/int-validation.pipe";
import { QueryRequired } from "src/decorators/query-required.decorator";

@Controller("balance-operation")
export class BalanceOperationController {
  constructor(
    private readonly balanceOperationService: BalanceOperationService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async find(
    @UserId() userId: string,
    @QueryRequired("projectId", IdValidationPipe) projectId: string,
    @Query("operation-type", OperationTypeValidationPipe)
    operationType?: BalanceOperationType,
    @Query("date-from", DateValidationPipe) dateFrom?: string,
    @Query("date-until", DateValidationPipe) dateUntil?: string,
    @Query("size", IntValidationPipe) size?: number
  ): Promise<BalanceOperationResponseDocument[]> {
    return this.balanceOperationService.find(userId, projectId, {
      operationType,
      dateFrom,
      dateUntil,
      size,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get("/count")
  async count(
    @UserId() userId: string,
    @QueryRequired("projectId", IdValidationPipe) projectId: string,
    @Query("operation-type", OperationTypeValidationPipe)
    operationType?: BalanceOperationType,
    @Query("date-from", DateValidationPipe) dateFrom?: string,
    @Query("date-until", DateValidationPipe) dateUntil?: string
  ): Promise<number> {
    return this.balanceOperationService.count(userId, projectId, {
      operationType,
      dateFrom,
      dateUntil,
    });
  }
}
