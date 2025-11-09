import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ALREADY_REGISTERED_ERROR,
  DEFAULT_PROJECT_NAME,
} from "./auth.constants";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ProjectService } from "src/project/project.service";
import { SaleService } from "src/sale/sale.service";
import { JwtAuthGuard } from "./guards/jwt.guard";
import { UserId } from "src/decorators/user-id.decorator";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly projectService: ProjectService,
    private readonly saleService: SaleService
  ) {}

  @UsePipes(new ValidationPipe())
  @Post("register")
  async register(@Body() dto: RegisterDto) {
    const oldUser = await this.authService.findUserByEmail(dto.email);
    if (oldUser) {
      throw new BadRequestException(ALREADY_REGISTERED_ERROR);
    }
    const newUser = await this.authService.createUser(dto);
    await this.projectService.create(newUser.id, {
      name: DEFAULT_PROJECT_NAME,
      color: "gray",
    });

    return newUser;
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post("login")
  async login(@Body() { email, password }: LoginDto) {
    await this.authService.validateUser(email, password);
    const user = await this.authService.findUserByEmail(email);
    // const sales = await this.saleService.find(user.id);

    // if (!sales.length) {
    //   const today = dayjs();
    //   const dateFrom = today.subtract(3, "month");

    // await this.saleService.updateSalesFromWbSales(
    //   dateFrom.format(DATE_FORMAT),
    //   today.format(DATE_FORMAT),
    //   [user]
    // );
    // }
    return this.authService.login(email);
  }

  @UseGuards(JwtAuthGuard)
  @Get("data")
  async findOne(@UserId() userId: string) {
    return this.authService.findUserById(userId);
  }
}
