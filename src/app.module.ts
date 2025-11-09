import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { WbModule } from "./wb/wb.module";
import { AuthModule } from "./auth/auth.module";
import { SaleModule } from "./sale/sale.module";
import { AdvertModule } from "./advert/advert.module";
import { ProjectModule } from "./project/project.module";
import { ProcurementModule } from "./procurement/procurement.module";
import { GoodModule } from "./good/good.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { getMongoConfig } from "./configs/mongo.config";
import { BalanceOperationModule } from "./balance-operation/balance-operation.module";
import { SupplyModule } from "./supply/supply.module";
@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getMongoConfig,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    WbModule,
    SaleModule,
    AdvertModule,
    ProjectModule,
    ProcurementModule,
    GoodModule,
    BalanceOperationModule,
    SupplyModule,
  ],
})
export class AppModule {}
