import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { RegisterDto } from "./dto/register.dto";
import { User } from "./user.schema";
import { genSalt, hash, compare } from "bcryptjs";
import { USER_NOT_FOUND_ERROR, WRONG_PASSWORD_ERROR } from "./auth.constants";
import { JwtService } from "@nestjs/jwt";

const projection: Partial<Record<keyof User, 0 | 1>> = {
  passwordHash: 0,
};

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly jwtService: JwtService
  ) {}

  async find() {
    return this.userModel.find();
  }

  async createUser(dto: RegisterDto) {
    const salt = await genSalt(10);
    const newUser = new this.userModel({
      email: dto.email,
      name: dto.name,
      avatar: "",
      wbTokenStatistics: dto.wbTokenStatistics,
      wbTokenPromotionAndAnalytics: dto.wbTokenPromotionAndAnalytics,
      wbContentToken: dto.wbContentToken,
      passwordHash: await hash(dto.password, salt),
    });

    return newUser.save();
  }

  async findUserById(id: string) {
    return this.userModel.findById(id, projection).exec();
  }

  async findUserByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async validateUser(
    email: string,
    password: string
  ): Promise<Pick<User, "email">> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException(USER_NOT_FOUND_ERROR);
    }
    const isCorrectPassword = await compare(password, user.passwordHash);
    if (!isCorrectPassword) {
      throw new UnauthorizedException(WRONG_PASSWORD_ERROR);
    }
    return { email: user.email };
  }

  async login(email: string) {
    const user = await this.findUserByEmail(email);
    const payload = { id: user.id, email };

    return {
      access_token: await this.jwtService.signAsync(payload, {
        expiresIn: "7 days",
      }),
    };
  }
}
