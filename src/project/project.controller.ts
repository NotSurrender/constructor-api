import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
  BadRequestException,
  Patch,
  NotFoundException,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { ProjectService } from "src/project/project.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UserId } from "src/decorators/user-id.decorator";
import { PROJECT_NOT_FOUND_ERROR } from "./project.constants";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { IdValidationPipe } from "src/pipes/id-validation.pipe";
import { WbService } from "src/wb/wb.service";
import { AuthService } from "src/auth/auth.service";
import { WbCard } from "src/wb/wb.interface";
import {
  GOOD_NOT_EXIST_ERROR,
  reduceCallbackForMap,
  WITHDRAW_AMOUNT_EXCEED_PROJECT_BALANCE_ERROR,
} from "src/common";
import { ProjectResponseDocument } from "./project.interface";
import { QueryRequired } from "src/decorators/query-required.decorator";
import { InvestInProjectDto } from "./dto/invest-in-project.dto";
import { WithdrawFromProjectDto } from "./dto/withdraw-from-project.dto";
import { TransferToProjectDto } from "./dto/transfer-to-project.dto";
import { HttpStatusCode } from "axios";

@Controller("project")
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly authService: AuthService,
    private readonly wbService: WbService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get("list")
  async find(@UserId() userId: string): Promise<ProjectResponseDocument[]> {
    return this.projectService.find(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":projectId")
  async findById(
    @UserId() userId: string,
    @Param("projectId", IdValidationPipe) projectId: string
  ): Promise<ProjectResponseDocument> {
    return this.projectService.findById(userId, projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findOne(
    @UserId() userId: string,
    @Res() res: Response,
    @QueryRequired("name") name
  ): Promise<void> {
    const project = await this.projectService.findByName(userId, name);

    if (!project) {
      res.status(HttpStatusCode.NotFound).send();
    }

    res.status(HttpStatusCode.Ok).send(project);
  }

  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Post()
  async create(
    @UserId() userId: string,
    @Body() dto: CreateProjectDto
  ): Promise<ProjectResponseDocument> {
    await this.projectService.validateProjectDto(userId, dto);
    return this.projectService.create(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Patch(":projectId")
  async patch(
    @UserId() userId: string,
    @Param("projectId", IdValidationPipe) projectId: string,
    @Body() dto: UpdateProjectDto
  ): Promise<ProjectResponseDocument | never> {
    if (dto.name) {
      await this.projectService.validateProjectDto(userId, dto, projectId);
    }

    if (dto.goodIds?.length) {
      await this.checkIfGoodsExistInWb(userId, dto.goodIds);
    }

    const updatedProject = await this.projectService.patch(
      userId,
      projectId,
      dto
    );
    if (!updatedProject) {
      throw new NotFoundException(PROJECT_NOT_FOUND_ERROR);
    }
    return updatedProject;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  async delete(
    @UserId() userId: string,
    @Param("id", IdValidationPipe) id: string
  ): Promise<void | never> {
    const deletedProject = await this.projectService.delete(userId, id);

    if (!deletedProject) {
      throw new NotFoundException(PROJECT_NOT_FOUND_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Patch("/:projectId/invest")
  async invest(
    @UserId() userId: string,
    @Param("projectId", IdValidationPipe) projectId: string,
    @Body() dto: InvestInProjectDto
  ) {
    return this.projectService.investInProject(userId, projectId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Patch(":projectId/withdraw")
  async withdraw(
    @UserId() userId: string,
    @Param("projectId", IdValidationPipe) projectId: string,
    @Body() dto: WithdrawFromProjectDto
  ) {
    const project = await this.projectService.findById(userId, projectId);
    if (project.balance <= 0) {
      throw new BadRequestException(
        WITHDRAW_AMOUNT_EXCEED_PROJECT_BALANCE_ERROR
      );
    }
    return this.projectService.withdrawFromProject(userId, projectId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Patch(":projectId/transfer")
  async transfer(
    @UserId() userId: string,
    @Param("projectId", IdValidationPipe) projectId: string,
    @Body() dto: TransferToProjectDto
  ) {
    const project = await this.projectService.findById(userId, projectId);
    if (project.balance <= 0) {
      throw new BadRequestException(
        WITHDRAW_AMOUNT_EXCEED_PROJECT_BALANCE_ERROR
      );
    }
    return this.projectService.transferToProject(userId, projectId, dto);
  }

  private async checkIfGoodsExistInWb(
    userId: string,
    goodIds: number[]
  ): Promise<void | never> {
    const { wbTokenPromotionAndAnalytics } =
      await this.authService.findUserById(userId);

    const { cards } = await this.wbService.getCards(
      wbTokenPromotionAndAnalytics
    );

    const nmIdsAndCardsMap = cards.reduce(
      reduceCallbackForMap("nmID"),
      new Map<number, WbCard>()
    );

    goodIds.forEach((goodId) => {
      if (!nmIdsAndCardsMap.has(goodId)) {
        throw new BadRequestException(GOOD_NOT_EXIST_ERROR);
      }
    });
  }
}
