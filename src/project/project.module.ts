import { forwardRef, Module } from "@nestjs/common";

import { ProjectController } from "./project.controller";
import { ProjectService } from "./project.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Project, ProjectSchema } from "./project.schema";
import { WbModule } from "src/wb/wb.module";
import { AuthModule } from "src/auth/auth.module";
import { BalanceOperationModule } from "src/balance-operation/balance-operation.module";

@Module({
  controllers: [ProjectController],
  providers: [ProjectService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Project.name,
        schema: ProjectSchema,
      },
    ]),
    forwardRef(() => AuthModule),
    WbModule,
    BalanceOperationModule,
  ],
  exports: [ProjectService],
})
export class ProjectModule {}
