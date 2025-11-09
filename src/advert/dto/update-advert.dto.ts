import {
  IsString,
  IsNumber,
  MaxLength,
  IsNotEmpty,
  Min,
  IsOptional,
} from 'class-validator';
import { IsPeriod } from 'src/validators/period.validator';

export class UpdateAdvertDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  readonly name?: string;

  @IsOptional()
  @IsPeriod()
  readonly period?: string;

  @IsOptional()
  @IsNumber()
  readonly goodId?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  readonly amount?: number;
}
