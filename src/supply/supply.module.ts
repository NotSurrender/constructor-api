import { Module } from "@nestjs/common";

import { SupplyService } from "./supply.service";

import { MongooseModule } from "@nestjs/mongoose";
import { Supply, SupplySchema } from "./supply.schema";
import { SupplyController } from "./supply.controller";
import { WbModule } from "src/wb/wb.module";
import { AuthModule } from "src/auth/auth.module";
import { GoodModule } from "src/good/good.module";
import { CacheModule } from "@nestjs/cache-manager";
import { ProcurementModule } from "src/procurement/procurement.module";

@Module({
  controllers: [SupplyController],
  providers: [SupplyService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Supply.name,
        schema: SupplySchema,
      },
    ]),
    AuthModule,
    WbModule,
    GoodModule,
    CacheModule.register(),
    ProcurementModule,
  ],
})
export class SupplyModule {}
