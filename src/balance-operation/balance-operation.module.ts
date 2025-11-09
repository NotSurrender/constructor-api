import { Module } from "@nestjs/common";

import { BalanceOperationController } from "./balance-operation.controller";
import { BalanceOperationService } from "./balance-operation.service";
import { MongooseModule } from "@nestjs/mongoose";
import {
  BalanceOperation,
  BalanceOperationSchema,
} from "./balance-operation.schema";

@Module({
  controllers: [BalanceOperationController],
  providers: [BalanceOperationService],
  imports: [
    MongooseModule.forFeature([
      {
        name: BalanceOperation.name,
        schema: BalanceOperationSchema,
      },
    ]),
  ],
  exports: [BalanceOperationService],
})
export class BalanceOperationModule {}
