import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { Response } from "express";
import { GoodService } from "./good.service";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { UserId } from "src/decorators/user-id.decorator";
import { IdValidationPipe } from "src/pipes/id-validation.pipe";
import { UnallocatedGood } from "./good.interface";
import { IntValidationPipe } from "src/pipes/int-validation.pipe";
import { QueryRequired } from "src/decorators/query-required.decorator";
import { HttpStatusCode } from "axios";
import { CacheInterceptor, CacheTTL } from "@nestjs/cache-manager";

@Controller("good")
export class GoodController {
  constructor(private readonly goodService: GoodService) {}

  @UseGuards(JwtAuthGuard)
  @Get("list")
  async find(
    @UserId() userId: string,
    @QueryRequired("projectId", IdValidationPipe) projectId: string,
    @Query("query") query?: string
  ) {
    return this.goodService.find(userId, projectId, { query });
  }

  @UseGuards(JwtAuthGuard)
  @Get("/unallocated")
  async findUnallocatedGoods(
    @UserId() userId: string,
    @Query("size", IntValidationPipe) size?: number
  ): Promise<UnallocatedGood[]> {
    return this.goodService.findUnallocatedGoods(userId, { size });
  }

  @UseGuards(JwtAuthGuard)
  @Get(":goodId")
  async findById(
    @UserId() userId: string,
    @Param("goodId", IdValidationPipe) goodId: string
  ) {
    return this.goodService.findById(userId, goodId);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  @Get(":goodId/details")
  @CacheTTL(50000)
  async fingGoodDetails(
    @UserId() userId: string,
    @Param("goodId", IdValidationPipe) goodId: string
  ) {
    return this.goodService.getGoodDetails(userId, goodId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findOne(
    @UserId() userId: string,
    @Res() res: Response,
    @QueryRequired("goodName") goodName: string,
    @Query("projectId", IdValidationPipe) projectId?: string,
    @Query("nmId") nmId?: number
  ): Promise<void> {
    const good = await this.goodService.findOne(userId, projectId, {
      goodName,
      nmId,
    });

    if (!good) {
      res.status(HttpStatusCode.NotFound).send();
      return;
    }

    res.status(HttpStatusCode.Ok).send(good);
  }

  @UseGuards(JwtAuthGuard)
  @Get("/unallocated/count")
  async countUnallocated(@UserId() userId: string): Promise<number> {
    return this.goodService.countUnallocated(userId);
  }

  // @UseGuards(JwtAuthGuard)
  // @Get("/balances")
  // async getBalances(
  //   @UserId() userId: string,
  //   @Query("projectId", IdValidationPipe) projectId?: string
  // ) {
  //   return this.goodService.getBalances(userId, projectId);
  // }
}
