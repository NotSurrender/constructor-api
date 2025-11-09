import { ConfigModule } from "@nestjs/config";
import { Module } from "@nestjs/common";

import { WbService } from "./wb.service";
import { HttpModule } from "@nestjs/axios";
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  providers: [WbService],
  imports: [ConfigModule, HttpModule, CacheModule.register()],
  exports: [WbService],
})
export class WbModule {}
