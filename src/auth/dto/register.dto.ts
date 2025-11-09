import { IsString, IsNotEmpty, IsEmail, MinLength } from "class-validator";

export class RegisterDto {
  @IsEmail()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  readonly password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  readonly wbTokenStatistics: string;

  @IsString()
  @IsNotEmpty()
  readonly wbTokenPromotionAndAnalytics: string;

  @IsString()
  @IsNotEmpty()
  readonly wbContentToken: string;
}
