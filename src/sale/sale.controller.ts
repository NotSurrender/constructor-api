import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseBoolPipe,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { SaleService } from "./sale.service";
import { UserId } from "src/decorators/user-id.decorator";
import { IdValidationPipe } from "src/pipes/id-validation.pipe";
import { PROJECT_NOT_FOUND, SALE_NOT_FOUND_ERROR } from "./sale.constants";
import { QueryRequired } from "src/decorators/query-required.decorator";
import { ProjectService } from "src/project/project.service";
import { SaleResponseDocument } from "./sale.interface";
import { WbSale } from "src/wb/wb.interface";
import { WbService } from "src/wb/wb.service";
import * as dayjs from "dayjs";
import { DATE_FORMAT } from "src/common";
import { AuthService } from "src/auth/auth.service";

@Controller("sale")
export class SaleController {
  constructor(
    private readonly saleService: SaleService,
    private readonly projectService: ProjectService,
    private readonly wbService: WbService,
    private readonly authService: AuthService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get("initialize")
  async initializeSales(@UserId() userId: string) {
    const user = await this.authService.findUserById(userId);
    const today = dayjs().format(DATE_FORMAT);
    await this.saleService.updateSalesFromWbSales("2024-01-29", today, [user]);
  }

  // @UseGuards(JwtAuthGuard)
  // @Get()
  // async find(
  //   @UserId() userId: string,
  //   @Query('projectId', IdValidationPipe) projectId?: string,
  // ): Promise<SaleResponseDocument[]> {
  //   if (projectId) {
  //     const project = await this.projectService.findById(userId, projectId);
  //     if (!project) {
  //       throw new NotFoundException(PROJECT_NOT_FOUND);
  //     }
  //     return this.saleService.find(userId, project.goodIds);
  //   }

  //   return this.saleService.find(userId);
  // }
}
