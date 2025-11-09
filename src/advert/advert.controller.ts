import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { WbService } from "src/wb/wb.service";
import { DateValidationPipe } from "src/pipes/date-validation.pipe";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { QueryRequired } from "src/decorators/query-required.decorator";
import { AuthService } from "src/auth/auth.service";

import { UserId } from "src/decorators/user-id.decorator";
import { ProjectService } from "src/project/project.service";
import { AdvertService } from "./advert.service";
import { CreateAdvertDto } from "./dto/create-advert.dto";
import {
  ADVERT_NOT_FOUND_ERROR,
  GOOD_NOT_ADDED_IN_PROJECT_ERROR,
} from "./advert.constants";
import { WbCard } from "src/wb/wb.interface";
import { Types } from "mongoose";
import { UpdateAdvertDto } from "./dto/update-advert.dto";
import { Advert } from "./advert.schema";
import { IdValidationPipe } from "src/pipes/id-validation.pipe";
import { AdvertResponseDocument } from "./advert.interface";
import { GOOD_NOT_EXIST_ERROR } from "src/common";
import { ProjectResponseDocument } from "src/project/project.interface";

@Controller("advert")
export class AdvertController {
  constructor(
    private readonly wbService: WbService,
    private readonly authService: AuthService,
    private readonly projectService: ProjectService,
    private readonly advertService: AdvertService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get("wb")
  async getWbAdCampaigns(
    @UserId() userId: string,
    @QueryRequired("from", DateValidationPipe) from: string,
    @QueryRequired("to", DateValidationPipe) to: string
  ) {
    const user = await this.authService.findUserById(userId);
    return this.wbService.getAdCostHistory(
      from,
      to,
      user.wbTokenPromotionAndAnalytics
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async find(@UserId() userId: string): Promise<AdvertResponseDocument[]> {
    return this.advertService.find(userId);
  }

  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Post()
  async create(@UserId() userId: string, @Body() dto: CreateAdvertDto) {
    const card = await this.checkAndGetWbCardIfExist(userId, dto.goodId);
    const project = await this.checkAndGetProjectIfExist(userId, card.nmID);

    return this.advertService.create({
      name: dto.name,
      period: dto.period,
      goodId: dto.goodId,
      amount: dto.amount,
      projectId: project._id,
      projectName: project.name,
      userId: new Types.ObjectId(userId),
    });
  }

  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Patch(":id")
  async update(
    @UserId() userId: string,
    @Param("id", IdValidationPipe) id: string,
    @Body() dto: UpdateAdvertDto
  ) {
    const advertToPatch = await this.prepareAdvertToPatch(userId, dto);

    const updatedAdvert = await this.advertService.patch(
      userId,
      id,
      advertToPatch
    );

    if (!updatedAdvert) {
      throw new NotFoundException(ADVERT_NOT_FOUND_ERROR);
    }

    return updatedAdvert;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  async delete(
    @UserId() userId: string,
    @Param("id", IdValidationPipe) id: string
  ) {
    const deletedAdvert = await this.advertService.delete(userId, id);

    if (!deletedAdvert) {
      throw new NotFoundException(ADVERT_NOT_FOUND_ERROR);
    }
  }

  private async prepareAdvertToPatch(
    userId: string,
    dto: UpdateAdvertDto
  ): Promise<Partial<Omit<Advert, "userId">>> {
    const advertToPatch: Partial<Omit<Advert, "userId">> = {};
    advertToPatch.name ??= dto.name;
    advertToPatch.amount ??= dto.amount;
    advertToPatch.goodId ??= dto.goodId;
    advertToPatch.period ??= dto.period;

    if (dto.goodId) {
      const card = await this.checkAndGetWbCardIfExist(userId, dto.goodId);
      const project = await this.checkAndGetProjectIfExist(userId, card.nmID);
      project.id = project._id;
      project.name = project.name;
    }

    return advertToPatch;
  }

  private async checkAndGetWbCardIfExist(
    userId: string,
    goodId: number
  ): Promise<WbCard | never> {
    const { wbTokenPromotionAndAnalytics } =
      await this.authService.findUserById(userId);
    const { cards } = await this.wbService.getCards(
      wbTokenPromotionAndAnalytics
    );

    const card = cards.find((card) => card.nmID === goodId);

    if (!card) {
      throw new NotFoundException(GOOD_NOT_EXIST_ERROR);
    }

    return card;
  }

  private async checkAndGetProjectIfExist(
    userId: string,
    goodId: number
  ): Promise<ProjectResponseDocument | never> {
    const project = await this.projectService.findByGoodIds(userId, [goodId]);

    if (!project) {
      throw new NotFoundException(GOOD_NOT_ADDED_IN_PROJECT_ERROR);
    }

    return project;
  }
}
