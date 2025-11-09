import { forwardRef, Module } from "@nestjs/common";
import { SaleController } from "./sale.controller";
import { WbModule } from "src/wb/wb.module";
import { SaleService } from "./sale.service";
import { AuthModule } from "src/auth/auth.module";
import { MongooseModule } from "@nestjs/mongoose";
import { Sale, SaleSchema } from "./sale.schema";
import { ProjectModule } from "src/project/project.module";

@Module({
  controllers: [SaleController],
  providers: [SaleService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Sale.name,
        schema: SaleSchema,
      },
    ]),
    WbModule,
    forwardRef(() => AuthModule),
    ProjectModule,
  ],
  exports: [SaleService],
})
export class SaleModule {}
