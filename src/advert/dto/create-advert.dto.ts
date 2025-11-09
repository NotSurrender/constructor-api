import {
  IsString,
  IsNumber,
  MaxLength,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { IsPeriod } from 'src/validators/period.validator';

export class CreateAdvertDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  readonly name: string;

  @IsPeriod()
  readonly period: string;

  @IsNumber()
  readonly goodId: number;

  @IsNumber()
  @Min(1)
  readonly amount: number;
}
