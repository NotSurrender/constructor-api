import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { ProcurementService } from "./procurement.service";
import { UserId } from "src/decorators/user-id.decorator";
import { CreateProcurementDto } from "./dto/create-procurement.dto";
import { ProjectService } from "src/project/project.service";
import { IdValidationPipe } from "src/pipes/id-validation.pipe";
import { QueryRequired } from "src/decorators/query-required.decorator";
import { AuthService } from "src/auth/auth.service";
import { SortValidationPipe } from "src/pipes/sort-validation.pipe";
import { Sort } from "src/common";
import { ProcurementAttachmentStatus } from "./procurement.interface";
import { AttachmentStatusesValidationPipe } from "src/pipes/attachment-statuses-validation.pipe";

@Controller("procurement")
export class ProcurementController {
  constructor(
    private readonly procurementService: ProcurementService,
    private readonly projectService: ProjectService,
    private readonly authService: AuthService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get("list")
  async find(
    @UserId() userId: string,
    @Query("projectId", IdValidationPipe) projectId?: string,
    @Query("goodId", IdValidationPipe) goodId?: string,
    @Query("supplyId", IdValidationPipe) supplyId?: string,
    @Query("sort", SortValidationPipe) sort: "1" | "-1" = "1",
    @Query("attachmentStatuses", AttachmentStatusesValidationPipe)
    attachmentStatuses?: ProcurementAttachmentStatus[]
  ) {
    return this.procurementService.find(
      userId,
      {
        projectId,
        goodId,
        supplyId,
        attachmentStatuses,
      },
      +sort
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get("count")
  async count(
    @UserId() userId: string,
    @QueryRequired("goodId", IdValidationPipe) goodId: string
  ) {
    return this.procurementService.count(userId, { goodId });
  }

  @UseGuards(JwtAuthGuard)
  @Get(":procurementId")
  async findById(
    @UserId() userId: string,
    @Param("procurementId", IdValidationPipe) procurementId: string
  ) {
    return this.procurementService.findById(userId, procurementId);
  }

  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Post()
  async create(
    @UserId() userId: string,
    @QueryRequired("projectId", IdValidationPipe) projectId: string,
    @Body() dto: CreateProcurementDto
  ) {
    const isProjectExist = await this.projectService.findById(
      userId,
      projectId
    );
    if (isProjectExist) {
      return this.procurementService.create(userId, projectId, dto);
    }
  }
}
