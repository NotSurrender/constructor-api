import { Module } from "@nestjs/common";

import { ProcurementController } from "./procurement.controller";
import { ProcurementService } from "./procurement.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Procurement, ProcurementSchema } from "./procurement.schema";
import { ProjectModule } from "src/project/project.module";
import { GoodModule } from "src/good/good.module";
import { BalanceOperationModule } from "src/balance-operation/balance-operation.module";
import { WbModule } from "src/wb/wb.module";
import { AuthModule } from "src/auth/auth.module";

@Module({
  controllers: [ProcurementController],
  providers: [ProcurementService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Procurement.name,
        schema: ProcurementSchema,
      },
    ]),
    ProjectModule,
    AuthModule,
    WbModule,
    GoodModule,
    BalanceOperationModule,
  ],
  exports: [ProcurementService],
})
export class ProcurementModule {}
