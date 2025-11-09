import { forwardRef, Module } from "@nestjs/common";

import { GoodController } from "./good.controller";
import { GoodService } from "./good.service";

import { WbModule } from "src/wb/wb.module";
import { SaleModule } from "src/sale/sale.module";
import { MongooseModule } from "@nestjs/mongoose";
import { Good, GoodSchema } from "./good.schema";
import { AuthModule } from "src/auth/auth.module";
import { ProcurementModule } from "src/procurement/procurement.module";
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  controllers: [GoodController],
  providers: [GoodService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Good.name,
        schema: GoodSchema,
      },
    ]),
    CacheModule.register(),
    WbModule,
    SaleModule,
    AuthModule,
    forwardRef(() => ProcurementModule),
  ],
  exports: [GoodService],
})
export class GoodModule {}
