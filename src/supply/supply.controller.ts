import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { UserId } from "src/decorators/user-id.decorator";
import { IdValidationPipe } from "src/pipes/id-validation.pipe";
import { SupplyService } from "./supply.service";
import { CacheInterceptor, CacheTTL } from "@nestjs/cache-manager";
import { UpdateSupplyProcurementDto } from "./dto/update-supply-procurement.dto";
import { ProcurementService } from "src/procurement/procurement.service";
import { SupplyStatus } from "./supply.interface";
import { SUPPLY_NOT_FOUND_ERROR } from "./supply.constants";

@Controller("supply")
export class SupplyController {
  constructor(
    private readonly supplyService: SupplyService,
    private readonly procurementService: ProcurementService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get("list")
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(1800)
  async find(
    @UserId() userId: string,
    @Query("goodId", IdValidationPipe) goodId?: string,
    @Query("procurementId", IdValidationPipe) procurementId?: string
  ) {
    return await this.supplyService.find(userId, { goodId, procurementId });
  }

  @UseGuards(JwtAuthGuard)
  @Get(":supplyId")
  async findById(
    @UserId() userId: string,
    @Param("supplyId", IdValidationPipe) supplyId: string
  ) {
    return await this.supplyService.findById(userId, supplyId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("/:supplyId/update-supply-procurements")
  async updateSupplyProcurements(
    @UserId() userId: string,
    @Param("supplyId", IdValidationPipe) supplyId: string,
    @Body() dto: UpdateSupplyProcurementDto[]
  ) {
    const supply = await this.supplyService.findById(userId, supplyId);

    if (!supply) {
      return new NotFoundException(SUPPLY_NOT_FOUND_ERROR);
    }

    return await this.supplyService.changeSupplyProcurements(
      userId,
      supplyId,
      dto
    );
  }
}
